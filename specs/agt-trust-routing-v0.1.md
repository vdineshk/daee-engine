# AGT-β: Trust-Score-Gated MCP Tool Router — Specification v0.1

**Primitive:** mcp-trust-router-v1.0  
**Claimed:** 2026-05-06 (DAEE-BUILDER RUN-025)  
**Live endpoint:** https://dominion-observatory.sgdata.workers.dev/route/{tool-name}  
**Empire claim:** https://github.com/vdineshk/daee-engine/blob/main/specs/agt-trust-routing-v0.1.md  
**Version deployed:** 7de5099d-5e87-44db-8b50-a97ced0be876

---

## 1. What it is

AGT-β is an HTTP endpoint that accepts a tool name and returns which MCP server to use for that tool, ranked by behavioral trust scores, with routing fees inversely correlated to trust score.

An agent wanting to call `calculate_cpf_contribution` does not need to know which MCP server is most reliable. It calls:

```
GET /route/calculate_cpf_contribution
```

And receives: the recommended server URL, ranked alternatives, trust attestation, and the cost of using each option (lower trust = higher fee).

This closes a gap in the MCP ecosystem: agent-to-agent tool call routing has no neutral, data-driven arbiter.

---

## 2. Endpoint

```
GET /route/{tool-name}
```

### Request

| Parameter | Location | Description |
|---|---|---|
| `tool-name` | URL path | URL-encoded tool name (e.g. `calculate_cpf_contribution`) |

No authentication required. Free tier returns full routing data.

### Response schema: `mcp-trust-router-v1.0`

```json
{
  "schema": "mcp-trust-router-v1.0",
  "tool": "calculate_cpf_contribution",
  "recommendation": "https://sg-cpf-calculator-mcp.sgdata.workers.dev",
  "routing_status": "ACTIVE",
  "routes": [
    {
      "rank": 1,
      "server_url": "https://sg-cpf-calculator-mcp.sgdata.workers.dev",
      "server_name": "SG CPF Calculator MCP",
      "trust_score": 85,
      "category": "finance",
      "call_count": 47,
      "success_rate": 98,
      "avg_latency_ms": 220,
      "last_seen": "2026-05-06T00:00:00Z",
      "fee_tier": "T1",
      "routing_fee_usdc": 0.001,
      "routing_confidence": "HIGH"
    }
  ],
  "routing_attestation": {
    "attested_by": "Dominion Observatory",
    "attested_at": "2026-05-06T00:00:00Z",
    "methodology": "behavioral telemetry — ranked by trust_score (success_rate × 0.7 + latency_score × 0.3)",
    "trust_score_range": { "min": 60, "max": 85 },
    "data_since": "2026-04-08",
    "fee_note": "routing_fee_usdc inversely correlated to trust_score — higher trust = lower cost"
  },
  "paid_tier": {
    "upgrade_url": "https://dominion-observatory.sgdata.workers.dev/agent-query/{server_slug}",
    "benefit": "compliance-grade trust verdict with full audit trail",
    "fee_usdc": 0.001
  },
  "observatory": "https://dominion-observatory.sgdata.workers.dev",
  "claim_uri": "https://github.com/vdineshk/daee-engine/blob/main/specs/agt-trust-routing-v0.1.md"
}
```

### routing_status values

| Status | Meaning |
|---|---|
| `ACTIVE` | Routes found, recommendation ready |
| `NO_COVERAGE` | No behavioral data for this tool yet |

### routing_confidence values

| Value | Condition |
|---|---|
| `HIGH` | ≥ 10 recorded calls for this tool on this server |
| `MEDIUM` | 3–9 calls |
| `LOW` | 1–2 calls |

---

## 3. Fee Tier Curve (T0–T3)

Fees are inversely correlated to trust score. Higher-trust servers are cheaper to route to — they've proven their reliability via behavioral telemetry.

| Tier | Trust Score Range | Routing Fee (USDC) | Rationale |
|---|---|---|---|
| T0 | ≥ 90 | 0.0005 | Proven, lowest risk |
| T1 | 70–89 | 0.001 | Reliable, minimal risk |
| T2 | 40–69 | 0.003 | Mixed record, elevated risk |
| T3 | < 40 | 0.008 | Unreliable, high risk premium |

The inverse relationship is the novel mechanic: agents are economically incentivized to use high-trust servers and to report outcomes (which improves routing quality for all).

---

## 4. Trust Score Methodology

Trust scores are computed from behavioral telemetry across the Dominion Observatory's 4,500+ tracked servers:

```
runtime_score = (success_rate × 0.70) + (latency_score × 0.30)
latency_score = max(0, 100 - avg_latency_ms / 50)
trust_score   = (static_score × 0.30) + (runtime_score × 0.70)
```

Data source: POST /api/report interactions reported by agents after calling MCP servers. Coverage improves as agents report outcomes.

---

## 5. Coverage Building

The router becomes more useful as more agents report tool outcomes:

```
POST /api/report
{
  "server_url": "https://my-mcp-server.workers.dev",
  "success": true,
  "latency_ms": 180,
  "tool_name": "calculate_cpf_contribution",
  "agent_id": "my-agent-v1"
}
```

Agents that report outcomes contribute to the trust network and improve routing for all.

---

## 6. Relationship to Empire Primitives

| Primitive | Description | Compounds how |
|---|---|---|
| AGT-α (EBTO x402) | Per-server trust verdict, x402 gated | AGT-β routes to the top AGT-α server |
| Benchmark `/benchmark/{slug}` | Per-server benchmark score | AGT-β uses trust score (which incorporates benchmark) |
| SLA Tier `/api/sla-tier` | Tier classification | AGT-β fee tier mirrors SLA tier logic |
| Observatory (4,500+ servers) | Trust data source | AGT-β queries are only as good as Observatory coverage |

---

## 7. Prior-Art Search (C4)

Searched 5 surfaces, 2026-05-06:

1. **mcpmarket.com/server/toolroute** — ToolRoute scores MCP servers but does NOT expose a routing HTTP endpoint accepting tool name, nor ties fees to trust score
2. **npm**: `mcp-router` variants are aggregation/proxy routers with no trust scoring or fee logic
3. **PyPI**: `mcp-trust-router` does not exist
4. **GitHub**: no repo implements unified tool-name → trust-ranked server selection + x402 fee inversion
5. **x402-discovery-mcp**: routes across x402 services but doesn't select between competing MCP servers for the same tool based on behavioral trust

**Conclusion:** The composition of (1) HTTP endpoint accepting tool name → ranked server list + (2) behavioral trust score ranking + (3) fees inversely correlated to trust score is EMPIRE-FIRST. No prior art for this exact composition found.

---

## 8. NOVELTY LEDGER Entry

```
PRIMITIVE: AGT-β Trust-Score-Gated MCP Tool Router (mcp-trust-router-v1.0)
CLAIMED: 2026-05-06
PRIOR-ART CHECK: 5-surface search (mcpmarket/ToolRoute, npm, PyPI, GitHub, x402-discovery-mcp)
  — composition (tool routing + behavioral trust ranking + x402 fee inversion) = empty space
EMPIRE'S CLAIM: https://dominion-observatory.sgdata.workers.dev/route/{tool-name}
  Version: 7de5099d-5e87-44db-8b50-a97ced0be876
  Spec: https://github.com/vdineshk/daee-engine/blob/main/specs/agt-trust-routing-v0.1.md
COMPETITION STATE: Empire alone. No other MCP trust registry routes by behavioral trust + fee inversion.
NEXT EXTENSION: 
  (1) Populate routing coverage via flywheel-keeper reporting tool names
  (2) AGT-γ: streaming trust-crossing events (SSE) at /attest-feed
  (3) Batch routing POST /trust-router for multi-tool queries
```

---

*DAEE-BUILDER v4.6, RUN-025, 2026-05-06*
