"""
LangChain integration for the Dominion Observatory.

Provides `ObservatoryTrustCallbackHandler`, a BaseCallbackHandler that:

  1. Before every tool call, reads the tool's runtime behavioral trust score
     from the Dominion Observatory (14,800+ MCP servers tracked, anonymized).
     Optionally blocks tools whose trust score falls below a threshold.
  2. After every tool call, reports anonymized telemetry
     (server_url, success, latency_ms, tool_name, http_status) back to the
     Observatory so the network's behavioral baselines keep improving.

Designed to complement:
  - Cryptographic audit trails (LangChain issue #35691 /
    EU AI Act Article 12 / ISO 42001 / AIUC-1).
  - Cryptographic agent identity and kill switches
    (LangChain issue #36232 — AIP protocol).

Trust scoring answers "is this server misbehaving right now?" — which neither
tamper-evident receipts nor signed intent envelopes can answer on their own.

Privacy: no prompts, tool arguments, tool outputs, user IDs, or IPs are sent
to the Observatory. Only the telemetry shape declared in the main SDK.

Usage
-----

    from langchain_openai import ChatOpenAI
    from langchain.agents import AgentExecutor
    from dominion_observatory.langchain import ObservatoryTrustCallbackHandler

    handler = ObservatoryTrustCallbackHandler(
        tool_server_urls={
            "web_search":   "https://search.example.com/mcp",
            "transfer_funds": "https://payments.example.com/mcp",
        },
        min_trust_score=40.0,   # block tools whose runtime trust < 40
        block_on_low_trust=True,
    )

    agent = AgentExecutor(..., callbacks=[handler])
"""

from __future__ import annotations

import time
from typing import Any, Dict, Iterable, Mapping, Optional
from uuid import UUID

from . import check_trust, report, OBSERVATORY_MCP_URL

try:
    from langchain_core.callbacks import BaseCallbackHandler  # type: ignore
except Exception as _err:  # pragma: no cover - optional dep
    raise ImportError(
        "dominion_observatory.langchain requires langchain-core. "
        "Install with `pip install langchain-core`."
    ) from _err


class LowTrustToolBlocked(RuntimeError):
    """Raised when a tool call is blocked because its Observatory trust score
    is below the configured threshold."""


class ObservatoryTrustCallbackHandler(BaseCallbackHandler):
    def __init__(
        self,
        tool_server_urls: Mapping[str, str],
        *,
        min_trust_score: Optional[float] = None,
        block_on_low_trust: bool = False,
        endpoint: str = OBSERVATORY_MCP_URL,
        trust_cache_ttl_s: float = 60.0,
        report_timeout_s: float = 2.0,
        trust_timeout_s: float = 2.0,
    ) -> None:
        self._tool_server_urls: Dict[str, str] = dict(tool_server_urls)
        self._min_trust = min_trust_score
        self._block = block_on_low_trust
        self._endpoint = endpoint
        self._trust_ttl = trust_cache_ttl_s
        self._report_timeout = report_timeout_s
        self._trust_timeout = trust_timeout_s

        self._starts: Dict[UUID, float] = {}
        self._trust_cache: Dict[str, tuple[float, Optional[float]]] = {}

    def _server_url_for(self, tool_name: Optional[str]) -> Optional[str]:
        if not tool_name:
            return None
        return self._tool_server_urls.get(tool_name)

    def _cached_trust(self, server_url: str) -> Optional[float]:
        now = time.time()
        cached = self._trust_cache.get(server_url)
        if cached and (now - cached[0]) < self._trust_ttl:
            return cached[1]
        score = check_trust(server_url, timeout=self._trust_timeout).trust_score
        self._trust_cache[server_url] = (now, score)
        return score

    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[Iterable[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        inputs: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        self._starts[run_id] = time.time()

        tool_name = (serialized or {}).get("name")
        server_url = self._server_url_for(tool_name)
        if server_url is None or self._min_trust is None:
            return

        score = self._cached_trust(server_url)
        if score is None:
            return
        if score < self._min_trust and self._block:
            raise LowTrustToolBlocked(
                f"Observatory trust={score:.1f} for '{tool_name}' "
                f"({server_url}) below threshold {self._min_trust:.1f}."
            )

    def on_tool_end(
        self,
        output: Any,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> None:
        self._record(run_id, success=True, http_status=200, **kwargs)

    def on_tool_error(
        self,
        error: BaseException,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> None:
        self._record(run_id, success=False, http_status=500, **kwargs)

    def _record(
        self,
        run_id: UUID,
        *,
        success: bool,
        http_status: int,
        **kwargs: Any,
    ) -> None:
        start = self._starts.pop(run_id, None)
        if start is None:
            return
        latency_ms = (time.time() - start) * 1000.0

        tool_name: Optional[str] = kwargs.get("name")
        if not tool_name:
            serialized = kwargs.get("serialized") or {}
            tool_name = serialized.get("name") if isinstance(serialized, dict) else None

        server_url = self._server_url_for(tool_name)
        if server_url is None:
            return

        report(
            server_url=server_url,
            success=success,
            latency_ms=latency_ms,
            tool_name=tool_name or "unknown",
            http_status=http_status,
            endpoint=self._endpoint,
            timeout=self._report_timeout,
        )


__all__ = ["ObservatoryTrustCallbackHandler", "LowTrustToolBlocked"]
