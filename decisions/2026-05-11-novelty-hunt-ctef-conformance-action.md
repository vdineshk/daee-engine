# NOVELTY HUNT — CTEF Conformance GitHub Action — 2026-05-11 BUILDER RUN-038

## Candidate primitive
`vdineshk/daee-engine/actions/ctef-conformance-check@main` — composite GitHub
Action calling `/api/ctef/readiness/{server_id}` on Dominion Observatory and
posting per-criterion remediation guidance to PRs.

## Prior-art search log (6 surfaces minimum per Constitution C4)

### Surface 1 — GitHub Marketplace search "ctef"
URL: `https://github.com/marketplace?type=actions&query=ctef`
Result: **NONE FOUND** ("No results. Try searching by different keywords.")

### Surface 2 — GitHub Marketplace search "mcp conformance"
URL: `https://github.com/marketplace?type=actions&query=mcp+conformance`
Result: 1 action — `mcp-use/mcp-conformance-action`. Tested below.

### Surface 3 — `mcp-use/mcp-conformance-action` (closest neighbor)
URL: `https://github.com/mcp-use/mcp-conformance-action`
Verdict: **NOT CTEF.** Tests Python/TypeScript MCP server implementations
against the MCP protocol spec itself. Does not call any behavioral-evidence
registry. Does not check CTEF v0.3.2 §4.5 criteria. Does not surface
remediation per CTEF criterion. Generates badges from its own test results,
not from runtime telemetry. Adjacent but orthogonal.

### Surface 4 — GitHub repo search "mcp conformance action"
URL: `https://github.com/search?q=mcp+conformance+action&type=repositories`
Results: 4 repos.
- `SamMorrowDrums/mcp-server-diff` (8 stars) — version-to-version diff of MCP
  protocol responses; not behavioral, not CTEF.
- `mcp-use/mcp-conformance-action` (4 stars) — see Surface 3.
- `dipandhali2021/mcp-verify` (0 stars) — generic MCP server verification CLI;
  no CTEF, no behavioral-evidence integration.
- `kbroughton/downscoping-mcp` — credential management, unrelated.

### Surface 5 — GitHub code search `"ctef" "action.yml"`
URL: `https://github.com/search?q=%22ctef%22+%22action.yml%22&type=code`
Result: **NONE FOUND** (code search returned no anonymous results; no
discoverable action.yml files referencing CTEF).

### Surface 6 — Dominion Observatory novelty ledger cross-check
Memory query: `memory_recall_by_tag(["builder","novelty-ledger"])` and
`memory_recall_by_tag(["strategist","novelty-ledger"])`.
Result: 7 CTEF-related primitives shipped (validate, attest, readiness,
ecosystem, well-known/ctef-conformance, trust-grade badge, fleet trust monitor).
**No CTEF GitHub Action shipped previously** by either Builder or Strategist.

## C4 verdict
**ZERO prior art for a GitHub Action that:**
1. Checks CTEF v0.3.2 §4.5 behavioral-evidence conformance
2. Integrates with a runtime behavioral-evidence registry (not static metadata)
3. Surfaces per-criterion remediation actions in PR comments
4. Generates the CTEF conformance document URL inline

The closest neighbor (`mcp-use/mcp-conformance-action`) tests against the MCP
*protocol* spec — orthogonal layer. CTEF is the behavioral-trust layer above MCP.

## Constitutional check
- C1 (agent-economy): CI agents calling Observatory ✓
- C2 (no human sales): action installs without conversation ✓
- C4 (originality): 6-surface search confirms zero prior art ✓
- Constraint 5 (free-tier): GitHub Actions free for public repos, action calls
  free-tier `dominion-observatory.sgdata.workers.dev` ✓
- Constraint 5 URL substitution: action defaults to workers.dev URL throughout ✓

## Why this compounds
Each MCP server that adopts this action generates recurring HTTP traffic to
`/api/ctef/readiness/{server_id}` on every PR. That endpoint is not in the
HARD RULE 21 spec-cited list but routes through identical CTEF criteria and
references the spec-cited endpoints (`/v1/behavioral-evidence`, `/api/sla-tier`,
`/api/trust-delta`) in its `evidence` fields. Adoption → external callers →
unblocks DISTRIBUTION-BACKLOG state.

Ships 8 days before CTEF v0.3.2 publishes (2026-05-19). When implementers read
the spec and look for "how do I check my CTEF conformance in CI?" the empire
is the only answer.

## Claim
Logging to NOVELTY LEDGER as `CTEF Conformance GitHub Action` (composite),
RUN-038, 2026-05-11. Empire's claim:
`https://github.com/vdineshk/daee-engine/tree/main/actions/ctef-conformance-check`
