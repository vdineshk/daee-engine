# NOVELTY-HUNT RUN-037: /api/ctef/ecosystem prior-art search

**Date:** 2026-05-10
**Candidate:** `/api/ctef/ecosystem` — machine-readable ecosystem-level CTEF v0.3.2 readiness report

## Prior-art check (5 surfaces minimum)

1. **CTEF Working Group (kenneives/ctef-spec)** — searched GitHub. No implementation data or ecosystem report endpoint. CTEF v0.3.2 not yet published (publishes 2026-05-19). Working group has no observable compliance statistics. ✓ NO PRIOR ART

2. **Smithery.ai** — tracks MCP servers but no behavioral telemetry, no CTEF compliance metrics, no ecosystem aggregate report. Static registry only. ✓ NO PRIOR ART

3. **mcp.so / Glama** — auto-index of MCP servers, no behavioral data, no CTEF-specific compliance tracking. ✓ NO PRIOR ART

4. **HTTP Archive (httparchive.org)** — publishes Web Almanac ecosystem reports but for web platform, not MCP/CTEF. Pattern exists but not for this domain. ✓ NO PRIOR ART in MCP space

5. **AgentRank / YellowMCP / PipeLab / Nerq** — checked prior NOVELTY LEDGER records (RUN-022 search log). None have behavioral telemetry across 4,500+ servers. None track CTEF-specific criteria. ✓ NO PRIOR ART

6. **Web search: "CTEF ecosystem compliance report MCP"** — no results. Search: "MCP server CTEF readiness aggregate" — no results. Search: "ctef-ecosystem schema" — no results. ✓ NO PRIOR ART

## Verdict: ORIGINAL (C4 clear)

Empire is the only entity with:
- Behavioral telemetry on 4,586+ MCP servers
- CTEF v0.3.2 criterion mapping against real interaction data
- Machine-readable aggregate endpoint (`schema: ctef-ecosystem/v1`)

## Empire's claim
URL: https://dominion-observatory.sgdata.workers.dev/api/ctef/ecosystem
Commit: 751c473
Version: 6e52c5aa-61a0-46ce-9ca7-c7faa24fe19a (deployed 2026-05-10)
