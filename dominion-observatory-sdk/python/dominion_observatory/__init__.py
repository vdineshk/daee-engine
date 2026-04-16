"""
Dominion Observatory SDK (Python)

Two functions:
    - report(...): send anonymized interaction telemetry to the Observatory
    - check_trust(server_url): fetch a server's behavioral trust score

Privacy: reports carry ONLY
    {agent_id, server_url, success, latency_ms, tool_name, http_status}.
No query content, user data, prompts, or IP addresses are collected.

About agent_id (REQUIRED as of 0.2.0):
    - Identifies which agent/app is reporting, so the Observatory can tell
      cross-ecosystem external telemetry apart from internal probes and
      synthetic test traffic.
    - Must be a stable, non-empty string. A random UUID, a package name,
      or any opaque identifier you control all work.
    - Do NOT use "anonymous" or "observatory_probe"; those values are
      reserved for internal classification and will be filtered out of
      cross-ecosystem external statistics.
"""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict
from typing import Callable, Optional, TypeVar

__version__ = "0.2.0"
__all__ = ["report", "check_trust", "instrument", "TrustScore"]

OBSERVATORY_MCP_URL = "https://dominion-observatory.sgdata.workers.dev/mcp"
OBSERVATORY_API_URL = "https://dominion-observatory.sgdata.workers.dev/api"
_USER_AGENT = f"dominion-observatory-sdk-python/{__version__}"

_RESERVED_AGENT_IDS = {"anonymous", "observatory_probe", ""}

_T = TypeVar("_T")


@dataclass
class TrustScore:
    found: bool
    server_url: str
    name: Optional[str] = None
    category: Optional[str] = None
    trust_score: Optional[float] = None
    static_score: Optional[float] = None
    runtime_score: Optional[float] = None
    metrics: Optional[dict] = None
    recent_7d: Optional[dict] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


def _validate_agent_id(agent_id: object) -> str:
    if not isinstance(agent_id, str):
        raise TypeError(
            "dominion-observatory-sdk: agent_id is required and must be a string. "
            "See https://dominion-observatory.sgdata.workers.dev for docs."
        )
    trimmed = agent_id.strip()
    if trimmed in _RESERVED_AGENT_IDS:
        raise ValueError(
            f'dominion-observatory-sdk: agent_id "{trimmed}" is reserved or empty. '
            "Pass a stable non-empty identifier (e.g. your package name or a UUID)."
        )
    return trimmed


def report(
    agent_id: str,
    server_url: str,
    success: bool,
    latency_ms: float,
    tool_name: str,
    http_status: Optional[int] = None,
    *,
    endpoint: str = OBSERVATORY_MCP_URL,
    timeout: float = 2.0,
) -> bool:
    """
    Fire-and-forget telemetry report. Raises only on invalid agent_id.

    Returns True on HTTP 2xx, False otherwise. Safe to ignore the return value.
    """
    agent_id = _validate_agent_id(agent_id)

    if http_status is None:
        http_status = 200 if success else 500

    payload = {
        "jsonrpc": "2.0",
        "id": int(time.time() * 1000),
        "method": "tools/call",
        "params": {
            "name": "report_interaction",
            "arguments": {
                "agent_id": agent_id,
                "server_url": server_url,
                "success": bool(success),
                "latency_ms": max(0, int(round(latency_ms))),
                "tool_name": tool_name,
                "http_status": int(http_status),
            },
        },
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={
            "Content-Type": "application/json",
            "User-Agent": _USER_AGENT,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return 200 <= resp.status < 300
    except Exception:
        return False


def check_trust(
    server_url: str,
    *,
    endpoint: str = OBSERVATORY_API_URL,
    timeout: float = 3.0,
) -> TrustScore:
    """
    Fetch a server's current trust score from the Observatory.
    Returns TrustScore(found=False, server_url=...) if the Observatory has no record.
    """
    url = f"{endpoint}/trust?url={urllib.parse.quote(server_url, safe='')}"
    req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if not (200 <= resp.status < 300):
                return TrustScore(found=False, server_url=server_url)
            body = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return TrustScore(found=False, server_url=server_url)

    return TrustScore(
        found=bool(body.get("found", False)),
        server_url=body.get("server_url", server_url),
        name=body.get("name"),
        category=body.get("category"),
        trust_score=body.get("trust_score"),
        static_score=body.get("static_score"),
        runtime_score=body.get("runtime_score"),
        metrics=body.get("metrics"),
        recent_7d=body.get("recent_7d"),
    )


def instrument(
    agent_id: str,
    server_url: str,
    tool_name: str,
    run: Callable[[], _T],
    *,
    endpoint: str = OBSERVATORY_MCP_URL,
) -> _T:
    """
    Convenience wrapper that measures latency and reports it.

    Usage:
        result = instrument(
            "my-langchain-agent",
            SERVER_URL,
            "get_holidays",
            lambda: handle_tool(args),
        )
    """
    agent_id = _validate_agent_id(agent_id)
    start = time.time()
    try:
        result = run()
        report(
            agent_id=agent_id,
            server_url=server_url,
            success=True,
            latency_ms=(time.time() - start) * 1000,
            tool_name=tool_name,
            http_status=200,
            endpoint=endpoint,
        )
        return result
    except Exception:
        report(
            agent_id=agent_id,
            server_url=server_url,
            success=False,
            latency_ms=(time.time() - start) * 1000,
            tool_name=tool_name,
            http_status=500,
            endpoint=endpoint,
        )
        raise
