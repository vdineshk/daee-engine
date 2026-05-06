"""
Google Agent Development Kit (ADK) integration for the Dominion Observatory.

Provides ``make_observatory_callbacks``, which returns ``before_tool_callback``
and ``after_tool_callback`` functions compatible with Google ADK's
``LlmAgent`` (and any ADK agent that accepts those parameters).

Before every tool call:
  - Reads the tool's runtime behavioral trust score from the Dominion
    Observatory (4,500+ MCP servers tracked, anonymized).
  - Optionally blocks tools whose trust score falls below a threshold
    by returning an error dict instead of letting the call proceed.

After every tool call:
  - Reports anonymized telemetry (server_url, success, latency_ms,
    tool_name, http_status) back to the Observatory so behavioral
    baselines keep improving across the ecosystem.

Usage
-----

    from google.adk.agents import LlmAgent
    from dominion_observatory.adk import make_observatory_callbacks

    before_cb, after_cb = make_observatory_callbacks(
        tool_server_urls={
            "search_web":     "https://search.example.com/mcp",
            "transfer_funds": "https://payments.example.com/mcp",
        },
        min_trust_score=40.0,      # optional: block tools with trust < 40
        block_on_low_trust=True,   # set False to warn-only
    )

    agent = LlmAgent(
        ...,
        before_tool_callback=before_cb,
        after_tool_callback=after_cb,
    )

Privacy: no prompts, tool arguments, tool outputs, user IDs, or IPs are sent
to the Observatory. Only the telemetry shape declared in the main SDK.
"""

from __future__ import annotations

import time
from typing import Any, Callable, Dict, Mapping, Optional, Tuple

from . import check_trust, report, OBSERVATORY_MCP_URL

try:
    from google.adk.tools import BaseTool  # type: ignore
    from google.adk.tools.tool_context import ToolContext  # type: ignore
except ImportError as _err:  # pragma: no cover
    raise ImportError(
        "dominion_observatory.adk requires google-adk. "
        "Install with `pip install google-adk`."
    ) from _err


class LowTrustToolBlocked(RuntimeError):
    """Raised when a tool call is blocked because its Observatory trust score
    is below the configured threshold."""


def make_observatory_callbacks(
    tool_server_urls: Mapping[str, str],
    *,
    min_trust_score: Optional[float] = None,
    block_on_low_trust: bool = False,
    endpoint: str = OBSERVATORY_MCP_URL,
    trust_cache_ttl_s: float = 60.0,
    report_timeout_s: float = 2.0,
    trust_timeout_s: float = 2.0,
) -> Tuple[
    Callable[[BaseTool, Dict[str, Any], ToolContext], Optional[Dict[str, Any]]],
    Callable[[BaseTool, Dict[str, Any], ToolContext, Dict[str, Any]], Optional[Dict[str, Any]]],
]:
    """Return ``(before_tool_callback, after_tool_callback)`` for an ADK agent.

    Parameters
    ----------
    tool_server_urls:
        Mapping from ADK tool name to the MCP server URL that backs it.
        Tools not in this mapping are passed through without trust checks.
    min_trust_score:
        If set, tools whose Observatory trust score is below this value are
        flagged. Combine with ``block_on_low_trust=True`` to hard-block them.
    block_on_low_trust:
        When True, a below-threshold tool call returns an error dict to the
        agent instead of invoking the tool. Default False (warn-only via telemetry).
    endpoint:
        Observatory MCP endpoint. Defaults to the public Observatory.
    trust_cache_ttl_s:
        How long (seconds) to cache a server's trust score before re-fetching.
    report_timeout_s:
        HTTP timeout for telemetry reports.
    trust_timeout_s:
        HTTP timeout for trust score lookups.
    """
    _tool_server_urls: Dict[str, str] = dict(tool_server_urls)
    _trust_cache: Dict[str, Tuple[float, Optional[float]]] = {}
    _starts: Dict[str, float] = {}

    def _server_url(tool_name: str) -> Optional[str]:
        return _tool_server_urls.get(tool_name)

    def _cached_trust(server_url: str) -> Optional[float]:
        now = time.time()
        cached = _trust_cache.get(server_url)
        if cached and (now - cached[0]) < trust_cache_ttl_s:
            return cached[1]
        score = check_trust(server_url, timeout=trust_timeout_s).trust_score
        _trust_cache[server_url] = (now, score)
        return score

    def before_tool_callback(
        tool: BaseTool,
        args: Dict[str, Any],
        tool_context: ToolContext,
    ) -> Optional[Dict[str, Any]]:
        tool_name = getattr(tool, "name", None) or ""
        _starts[tool_name] = time.time()

        server_url = _server_url(tool_name)
        if server_url is None or min_trust_score is None:
            return None

        score = _cached_trust(server_url)
        if score is not None and score < min_trust_score and block_on_low_trust:
            return {
                "error": (
                    f"Tool '{tool_name}' blocked by Dominion Observatory: "
                    f"trust_score={score:.1f} < threshold {min_trust_score:.1f}. "
                    f"Server: {server_url}"
                )
            }
        return None

    def after_tool_callback(
        tool: BaseTool,
        args: Dict[str, Any],
        tool_context: ToolContext,
        response: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        tool_name = getattr(tool, "name", None) or ""
        start = _starts.pop(tool_name, None)
        latency_ms = (time.time() - start) * 1000.0 if start is not None else None

        server_url = _server_url(tool_name)
        if server_url is None:
            return None

        success = "error" not in (response or {})
        report(
            server_url=server_url,
            success=success,
            latency_ms=latency_ms,
            tool_name=tool_name or "unknown",
            http_status=200 if success else 500,
            endpoint=endpoint,
            timeout=report_timeout_s,
        )
        return None

    return before_tool_callback, after_tool_callback


__all__ = ["make_observatory_callbacks", "LowTrustToolBlocked"]
