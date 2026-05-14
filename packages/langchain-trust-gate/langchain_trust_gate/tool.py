"""TrustGateTool — LangChain tool for behavioral trust scoring via Dominion Observatory.

Implements:
  - TrustGateTool(BaseTool): drop-in LangChain tool for agent pipelines
  - check_trust(): standalone async function for direct use
  - check_trust_sync(): synchronous wrapper

Decision thresholds (x402 trust-provider spec v0.1):
  - PASS:      trust_score >= 60  (Silver tier or above)
  - FAIL:      trust_score <  40  (below Bronze tier)
  - UNCERTAIN: 40 <= trust_score < 60  (review band)
"""

from __future__ import annotations

import asyncio
from typing import Any, Optional, TypedDict

import httpx
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

# ── Constants ────────────────────────────────────────────────────────────

OBSERVATORY_BASE = "https://dominion-observatory.sgdata.workers.dev"
DEFAULT_PASS_THRESHOLD = 60
DEFAULT_FAIL_THRESHOLD = 40
DEFAULT_TIMEOUT = 5.0


# ── Return type ──────────────────────────────────────────────────────────

class TrustEvaluation(TypedDict):
    """Structured result from a trust evaluation."""
    decision: str
    score: Optional[float]
    raw_score: Optional[int]
    reason_code: str
    evidence_uri: Optional[str]
    provider: str
    agent_id: str
    evaluated_at: str


# ── Input schema ─────────────────────────────────────────────────────────

class TrustGateInput(BaseModel):
    """Input schema for TrustGateTool."""
    agent_id: str = Field(
        description="The identifier of the agent or MCP server to evaluate "
        "(e.g., 'sg-cpf-calculator', a server URL slug, or DID)."
    )


# ── Core evaluation logic ───────────────────────────────────────────────

async def _evaluate(
    agent_id: str,
    *,
    base_url: str = OBSERVATORY_BASE,
    pass_threshold: int = DEFAULT_PASS_THRESHOLD,
    fail_threshold: int = DEFAULT_FAIL_THRESHOLD,
    timeout: float = DEFAULT_TIMEOUT,
) -> TrustEvaluation:
    """Query Dominion Observatory and return a TrustEvaluation."""
    url = f"{base_url}/api/agent-query/{agent_id}"

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(url)

    evaluated_at = __import__("datetime").datetime.utcnow().isoformat() + "Z"

    if resp.status_code == 404:
        return TrustEvaluation(
            decision="UNCERTAIN",
            score=None,
            raw_score=None,
            reason_code="agent_not_found",
            evidence_uri=None,
            provider="dominion-observatory",
            agent_id=agent_id,
            evaluated_at=evaluated_at,
        )

    resp.raise_for_status()
    data = resp.json()
    trust_score: int = data["server"]["trust_score"]
    normalized: float = round(trust_score / 100, 4)
    server_url: str = data["server"]["url"]

    if trust_score >= pass_threshold:
        decision = "PASS"
        reason = "behavioral_trust_above_silver_threshold"
    elif trust_score < fail_threshold:
        decision = "FAIL"
        reason = "behavioral_trust_below_bronze_threshold"
    else:
        decision = "UNCERTAIN"
        reason = "behavioral_trust_in_review_band"

    return TrustEvaluation(
        decision=decision,
        score=normalized,
        raw_score=trust_score,
        reason_code=reason,
        evidence_uri=f"{base_url}/servers/{server_url}",
        provider="dominion-observatory",
        agent_id=agent_id,
        evaluated_at=evaluated_at,
    )


# ── Standalone functions ────────────────────────────────────────────────

async def check_trust(
    agent_id: str,
    *,
    base_url: str = OBSERVATORY_BASE,
    pass_threshold: int = DEFAULT_PASS_THRESHOLD,
    fail_threshold: int = DEFAULT_FAIL_THRESHOLD,
    timeout: float = DEFAULT_TIMEOUT,
) -> TrustEvaluation:
    """Evaluate an agent's behavioral trust score (async).

    Args:
        agent_id: Identifier of the agent or MCP server.
        base_url: Observatory API base URL.
        pass_threshold: Minimum score (0-100) for PASS.
        fail_threshold: Scores below this are FAIL.
        timeout: HTTP request timeout in seconds.

    Returns:
        TrustEvaluation dict with decision, score, and evidence.
    """
    return await _evaluate(
        agent_id,
        base_url=base_url,
        pass_threshold=pass_threshold,
        fail_threshold=fail_threshold,
        timeout=timeout,
    )


def check_trust_sync(
    agent_id: str,
    *,
    base_url: str = OBSERVATORY_BASE,
    pass_threshold: int = DEFAULT_PASS_THRESHOLD,
    fail_threshold: int = DEFAULT_FAIL_THRESHOLD,
    timeout: float = DEFAULT_TIMEOUT,
) -> TrustEvaluation:
    """Evaluate an agent's behavioral trust score (synchronous wrapper)."""
    return asyncio.run(
        check_trust(
            agent_id,
            base_url=base_url,
            pass_threshold=pass_threshold,
            fail_threshold=fail_threshold,
            timeout=timeout,
        )
    )


# ── LangChain Tool ──────────────────────────────────────────────────────

class TrustGateTool(BaseTool):
    """Evaluate the behavioral trust score of an agent or MCP server
    before allowing sensitive operations.

    Queries the Dominion Observatory REST API for real behavioral
    attestation data (interaction history, success rates, latency)
    and returns a PASS / FAIL / UNCERTAIN decision.

    Use this tool in agent pipelines to gate actions on trust:
      - PASS:      proceed with the operation
      - FAIL:      block the operation, flag for review
      - UNCERTAIN: apply additional checks or human approval
    """

    name: str = "trust_gate"
    description: str = (
        "Evaluate the behavioral trust score of an agent or MCP server "
        "via Dominion Observatory. Returns PASS, FAIL, or UNCERTAIN with "
        "a normalized score (0.0-1.0) and evidence URI. Use before "
        "executing sensitive operations with untrusted agents."
    )
    args_schema: type[BaseModel] = TrustGateInput

    # Configurable fields
    base_url: str = OBSERVATORY_BASE
    pass_threshold: int = DEFAULT_PASS_THRESHOLD
    fail_threshold: int = DEFAULT_FAIL_THRESHOLD
    timeout: float = DEFAULT_TIMEOUT

    def _run(self, agent_id: str, **kwargs: Any) -> dict[str, Any]:
        """Synchronous evaluation (calls async internally)."""
        result = check_trust_sync(
            agent_id,
            base_url=self.base_url,
            pass_threshold=self.pass_threshold,
            fail_threshold=self.fail_threshold,
            timeout=self.timeout,
        )
        return dict(result)

    async def _arun(self, agent_id: str, **kwargs: Any) -> dict[str, Any]:
        """Async evaluation — preferred in async agent pipelines."""
        result = await check_trust(
            agent_id,
            base_url=self.base_url,
            pass_threshold=self.pass_threshold,
            fail_threshold=self.fail_threshold,
            timeout=self.timeout,
        )
        return dict(result)
