"""
trust_gate — pre-flight trust-score check for MCP servers.

Use it as a guardrail BEFORE your LangChain agent talks to an unfamiliar
MCP server::

    from dominion_observatory_langchain import trust_gate, TrustGateError

    check = trust_gate(agent_id="my-app/1.0", min_score=50.0)

    try:
        check("https://some-random-mcp.example.com/mcp")
    except TrustGateError as exc:
        # Refuse the call, log it, fall back to a trusted server, etc.
        ...

The gate is a hard floor. A server the Observatory has no record of is
treated as "unknown" and rejected by default (``allow_unknown=False``).
Change that at your own risk.
"""

from __future__ import annotations

from typing import Callable, Optional

from dominion_observatory import check_trust


class TrustGateError(RuntimeError):
    """Raised when a server's trust score is below the configured floor."""

    def __init__(
        self,
        server_url: str,
        actual_score: Optional[float],
        min_score: float,
        reason: str,
    ) -> None:
        super().__init__(
            f"TrustGate blocked {server_url}: {reason} "
            f"(score={actual_score}, floor={min_score})"
        )
        self.server_url = server_url
        self.actual_score = actual_score
        self.min_score = min_score
        self.reason = reason


def trust_gate(
    agent_id: str,
    min_score: float = 50.0,
    allow_unknown: bool = False,
) -> Callable[[str], float]:
    """
    Return a callable that raises ``TrustGateError`` if a server's current
    Observatory trust score is below ``min_score``. Returns the score on
    success so callers can log or branch on it.

    ``agent_id`` is kept for API symmetry — it is forwarded to future
    Observatory read endpoints that attribute trust-lookup traffic, so you
    should use the same agent_id you pass to ``ObservatoryCallbackHandler``.
    """
    if not isinstance(agent_id, str) or not agent_id.strip():
        raise ValueError("trust_gate: agent_id must be a non-empty string.")
    if agent_id.strip() in {"anonymous", "observatory_probe"}:
        raise ValueError(f'trust_gate: agent_id "{agent_id}" is reserved.')
    if min_score < 0 or min_score > 100:
        raise ValueError("trust_gate: min_score must be in [0, 100].")

    def _gate(server_url: str) -> float:
        score = check_trust(server_url)
        if not score.found:
            if allow_unknown:
                return 0.0
            raise TrustGateError(
                server_url=server_url,
                actual_score=None,
                min_score=min_score,
                reason="server is not tracked by the Observatory",
            )
        actual = float(score.trust_score or 0.0)
        if actual < min_score:
            raise TrustGateError(
                server_url=server_url,
                actual_score=actual,
                min_score=min_score,
                reason="trust score below floor",
            )
        return actual

    return _gate
