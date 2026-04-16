"""
ObservatoryCallbackHandler — LangChain callback that reports every tool call.

Design:
    * Subclasses ``langchain_core.callbacks.BaseCallbackHandler`` when it is
      importable, otherwise falls back to a plain ``object`` base class so
      the package still imports in environments without LangChain installed
      (e.g. CI smoke tests that only exercise the SDK round-trip).
    * Hooks ``on_tool_start`` / ``on_tool_end`` / ``on_tool_error``.
    * Infers ``server_url`` from the tool's ``metadata`` (expected key
      ``observatory.server_url``) or from an explicit mapping passed at
      construction time. Tools without a ``server_url`` are silently skipped
      — we only report MCP tool calls, not every chain step.
    * Latency is measured in the callback itself. The underlying Observatory
      SDK call is fire-and-forget — if the Observatory is unreachable the
      agent never sees a crash.

Usage:
    from dominion_observatory_langchain import ObservatoryCallbackHandler

    handler = ObservatoryCallbackHandler(agent_id="my-langgraph-app/1.0")
    agent.invoke(input, config={"callbacks": [handler]})
"""

from __future__ import annotations

import time
from typing import Any, Dict, Mapping, Optional
from uuid import UUID

from dominion_observatory import report as _sdk_report

try:
    from langchain_core.callbacks import BaseCallbackHandler as _LangChainBase
except ImportError:  # pragma: no cover - exercised only when LC absent
    _LangChainBase = object  # type: ignore[assignment,misc]


# Public constant: the key LangChain tool authors put in a tool's metadata
# to opt that tool into Observatory reporting.
SERVER_URL_METADATA_KEY = "observatory.server_url"

_RESERVED_AGENT_IDS = {"anonymous", "observatory_probe"}


class ObservatoryCallbackHandler(_LangChainBase):  # type: ignore[misc,valid-type]
    """
    Auto-report every LangChain tool invocation to the Dominion Observatory.

    Parameters
    ----------
    agent_id:
        Stable, non-empty identifier for your application. Must NOT be
        ``"anonymous"`` or ``"observatory_probe"`` — those are reserved and
        will be filtered out of cross-ecosystem external statistics. A good
        agent_id looks like ``"my-company/my-app/1.2"`` or a UUID.
    server_url_map:
        Optional explicit mapping from tool name to MCP server URL. Tools
        that don't carry a ``metadata[observatory.server_url]`` field fall
        back to this mapping. Tools present in neither are skipped.
    """

    # LangChain's dispatcher reads these class attrs to decide routing.
    # We only want tool events; everything else is a no-op.
    raise_error: bool = False
    run_inline: bool = True
    ignore_llm: bool = True
    ignore_chain: bool = True
    ignore_agent: bool = True
    ignore_retriever: bool = True
    ignore_chat_model: bool = True
    ignore_custom_event: bool = True

    def __init__(
        self,
        agent_id: str,
        server_url_map: Optional[Mapping[str, str]] = None,
    ) -> None:
        if not isinstance(agent_id, str) or not agent_id.strip():
            raise ValueError(
                "ObservatoryCallbackHandler: agent_id must be a non-empty string."
            )
        if agent_id.strip() in _RESERVED_AGENT_IDS:
            raise ValueError(
                f'ObservatoryCallbackHandler: agent_id "{agent_id}" is reserved. '
                "Use a stable identifier you control."
            )

        # Some LangChain base classes take no args; others take kwargs. We
        # only call super().__init__() when we're actually subclassing the
        # real LangChain base, to stay compatible across versions.
        if _LangChainBase is not object:
            try:
                super().__init__()
            except TypeError:
                pass

        self.agent_id: str = agent_id.strip()
        self._server_url_map: Dict[str, str] = dict(server_url_map or {})
        # run_id -> (start_time, server_url, tool_name)
        self._active: Dict[UUID, tuple] = {}

    # Public — users can extend the map at runtime, e.g. after constructing
    # a LangGraph graph whose tool names are known only later.
    def register_server_url(self, tool_name: str, server_url: str) -> None:
        self._server_url_map[tool_name] = server_url

    def _resolve_server_url(
        self,
        serialized: Any,
        metadata: Optional[Mapping[str, Any]],
        tool_name: str,
    ) -> Optional[str]:
        # Per-invocation metadata wins (caller used config={"metadata": ...}).
        if isinstance(metadata, Mapping):
            val = metadata.get(SERVER_URL_METADATA_KEY)
            if isinstance(val, str) and val:
                return val
        # Tool-definition metadata next.
        if isinstance(serialized, Mapping):
            meta = serialized.get("metadata")
            if meta is None:
                kwargs = serialized.get("kwargs")
                if isinstance(kwargs, Mapping):
                    meta = kwargs.get("metadata")
            if isinstance(meta, Mapping):
                val = meta.get(SERVER_URL_METADATA_KEY)
                if isinstance(val, str) and val:
                    return val
        # Fallback: explicit map at construction time.
        return self._server_url_map.get(tool_name)

    # --- LangChain BaseCallbackHandler interface --------------------------

    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,  # noqa: ARG002 — NEVER sent to Observatory
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,  # noqa: ARG002
        tags: Optional[list] = None,  # noqa: ARG002
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,  # noqa: ARG002
    ) -> None:
        tool_name = ""
        if isinstance(serialized, Mapping):
            tool_name = str(serialized.get("name") or "")
        if not tool_name:
            tool_name = "unknown_tool"

        server_url = self._resolve_server_url(serialized, metadata, tool_name)
        if server_url is None:
            # Not an MCP tool we know about — skip silently.
            return

        self._active[run_id] = (time.time(), server_url, tool_name)

    def on_tool_end(
        self,
        output: Any,  # noqa: ARG002 — never inspected, never sent
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,  # noqa: ARG002
        **kwargs: Any,  # noqa: ARG002
    ) -> None:
        state = self._active.pop(run_id, None)
        if state is None:
            return
        start, server_url, tool_name = state
        _sdk_report(
            agent_id=self.agent_id,
            server_url=server_url,
            success=True,
            latency_ms=(time.time() - start) * 1000,
            tool_name=tool_name,
            http_status=200,
        )

    def on_tool_error(
        self,
        error: BaseException,  # noqa: ARG002
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,  # noqa: ARG002
        **kwargs: Any,  # noqa: ARG002
    ) -> None:
        state = self._active.pop(run_id, None)
        if state is None:
            return
        start, server_url, tool_name = state
        _sdk_report(
            agent_id=self.agent_id,
            server_url=server_url,
            success=False,
            latency_ms=(time.time() - start) * 1000,
            tool_name=tool_name,
            http_status=500,
        )
