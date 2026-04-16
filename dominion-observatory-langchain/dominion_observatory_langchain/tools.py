"""
observatory_tools — LangChain Tool instances the agent itself can call.

Gives an agent two introspection tools:

    * ``check_mcp_trust(server_url)`` — returns the current Observatory
      trust score for any MCP server URL.
    * ``observatory_stats()`` — returns aggregated Observatory stats
      (total interactions, server count, category breakdown).

Both tools return plain dicts the LLM can reason about. Neither tool ever
sends user prompt content or tool inputs to the Observatory.
"""

from __future__ import annotations

import json
import urllib.request
from typing import Any, Dict, List

from dominion_observatory import check_trust

OBSERVATORY_STATS_URL = "https://dominion-observatory.sgdata.workers.dev/api/stats"


def _load_tool_cls() -> type:
    try:
        from langchain_core.tools import Tool  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise ImportError(
            "dominion-observatory-langchain: observatory_tools() requires "
            "`langchain-core` to be installed. Install with "
            "`pip install dominion-observatory-langchain[langchain]`."
        ) from exc
    return Tool


def _fetch_stats() -> Dict[str, Any]:
    req = urllib.request.Request(
        OBSERVATORY_STATS_URL,
        headers={"User-Agent": "dominion-observatory-langchain/0.1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            if 200 <= resp.status < 300:
                return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        return {"error": str(exc)}
    return {"error": "non-2xx"}


def observatory_tools(agent_id: str) -> List[Any]:
    """
    Return a list of LangChain ``Tool`` instances backed by the Observatory.

    ``agent_id`` is reserved for future attribution of read traffic.
    """
    if not isinstance(agent_id, str) or not agent_id.strip():
        raise ValueError("observatory_tools: agent_id must be a non-empty string.")
    if agent_id.strip() in {"anonymous", "observatory_probe"}:
        raise ValueError(f'observatory_tools: agent_id "{agent_id}" is reserved.')

    Tool = _load_tool_cls()

    def _check_trust_fn(server_url: str) -> Dict[str, Any]:
        score = check_trust(server_url)
        return score.to_dict()

    def _stats_fn(_: str = "") -> Dict[str, Any]:
        return _fetch_stats()

    check_tool = Tool(
        name="check_mcp_trust",
        description=(
            "Fetch the Dominion Observatory trust score for an MCP server. "
            "Input: the full server URL. Returns a dict with trust_score, "
            "static_score, runtime_score, category, and recent_7d metrics. "
            "Use this BEFORE calling an unfamiliar MCP server."
        ),
        func=_check_trust_fn,
    )

    stats_tool = Tool(
        name="observatory_stats",
        description=(
            "Fetch aggregate Dominion Observatory stats (total interactions, "
            "servers tracked, category breakdown, external demand). Takes no "
            "meaningful input. Returns a dict."
        ),
        func=_stats_fn,
    )

    return [check_tool, stats_tool]
