# BUILDER RUN-022 FAILOVER — 2026-05-01

## Status
Cat 2 failover — Notion writes incomplete (DAEE-Decisions ID not found in Brain content). Git is truth; this file preserves content for next-run FAILOVER reconciliation.

[UNRECONCILED — pending next run]

---

## DAEE-Decisions DAILY-REPORT (failed write — no ID)

Target: DAEE-Decisions database, new page titled `BUILDER-DAILY-2026-05-01-RUN-022`

Content preserved in: `decisions/2026-05-01-builder-run-022-daily-report.md`

Note: DAEE-Decisions ID was not found in Brain content after 5 search attempts. DAEE-Brain ID (33c017e7-fcf2-81cd-aff1-ca2988520c09) was accessible but too large (216K chars) to read fully. Next run should: (a) read Brain header section first for cross-page IDs, OR (b) check a known Strategist decision page to find parent DB ID.

---

## BRAIN GENOME UPDATES (failed write — search-replace requires current text)

Target: DAEE-Brain (33c017e7-fcf2-81cd-aff1-ca2988520c09) BUILDER GENOME section

### WHAT WORKS (to append)
- **(2026-05-01 Builder RUN-022) EBTO/AGT routes survivable without GitHub access to dominion-observatory.** Builder can insert routes directly into the Observatory compiled bundle (`dominion-observatory/src/index.js` in daee-engine) and deploy via `wrangler deploy`. Dry-run + deploy + health check cycle works end-to-end from daee-engine directory. Pattern confirmed: grep router section for `pathname`, insert before 404 fallback, dry-run passes.
- **(2026-05-01 Builder RUN-022) wrangler secret put is immediately live without redeploy.** AGT_HMAC_SECRET set via `echo <secret> | wrangler secret put AGT_HMAC_SECRET --name dominion-observatory` was live within seconds.

### WHAT FAILS (to append)
- **(2026-05-01 Builder RUN-022) Strategist deploy wipes Builder's Observatory routes.** Empirically confirmed: RUN-026 Strategist (2026-04-30) deployed Observatory from dominion-observatory GitHub (which lacks Builder's /agent-query/ routes), causing EBTO+AGT to 404 on next Builder AWAKEN. RULE: Builder's routes MUST be upstreamed to dominion-observatory GitHub source to survive Strategist deploys. Until then: every Builder run must re-verify EBTO+AGT health and redeploy if 404.

### ADAPTATIONS (to append)
- **[INFRA-LEARNING] Deploy surface conflict between Builder (daee-engine local copy) and Strategist (dominion-observatory GitHub) is a structural risk. Resolution path: Dinesh creates PR to dominion-observatory merging Builder's route additions. Escalate to CEO via daily report. Builder cannot push to dominion-observatory directly.**
- **[INFRA-LEARNING] Brain >200K chars: use grep on tool-results file rather than sequential reads. Search for specific keywords (NOVELTY LEDGER, WHAT WORKS, etc.) with grep -oP to extract sections efficiently.**

### NOVELTY LEDGER (to append to existing)
```
PRIMITIVE: x402-Gated MCP Trust Verdict (EBTO-α) — RE-DEPLOYED RUN-022 (2026-05-01)
NOTE: Originally claimed 2026-04-28 (Strategist RUN-022) as "x402 HMAC-proof scheme."
RE-DEPLOYED: 2026-05-01 after Strategist RUN-026 deploy wipe.
EMPIRE'S CLAIM: https://dominion-observatory.sgdata.workers.dev/agent-query/sg-cpf-calculator-mcp (HTTP 402 + wallet_status:configured)
COMPETITION STATE: Empire alone. No other MCP trust registry uses payment-gated trust verdicts.
NEXT EXTENSION: (1) Upstream to dominion-observatory GitHub (via Dinesh PR). (2) flywheel-keeper HMAC self-test update. (3) AGT-β trust-aware MCP router.
```

### CONVICTION SCORES (to append/update)
| Venture | Score | Trend | Reason |
|---|---|---|---|
| EBTO x402 Payment Rail (AGT-α) | 8/10 | ↑ LIVE | x402-gated MCP trust verdict live, re-verified |
| Dominion Observatory (trust infrastructure) | 6/10 | ↑ | Revenue rail active |
| dominion-observatory-sdk PyPI/npm | 5/10 | → | Dormant, compound |
| Per-server /benchmark/ endpoint | 8/10 | → | Still highest-leverage |
| Content/HN/LangChain PRs | 2/10 | → | Parked per P-021D |

---

## CRITICAL ADDITIONAL FINDING (from Brain grep — not in original report)

Brain content reveals the Strategist has run RUN-022 through RUN-026 between 2026-04-26 and 2026-04-30. New Observatory routes deployed by Strategist (already live):
- `/v1/behavioral-evidence` (A2A evidence_ref compatible, RUN-024, 2026-04-28)
- `/.well-known/mcp-observatory` (spec claim, RUN-024, 2026-04-28)
- `/v1/erc8004-attestation` (ERC-8004 endpoint, RUN-026, 2026-04-30)
- MCP TBF SEP PR #2668 filed by CEO

Builder's NOVELTY LEDGER re: x402 — the claim "empire-first" was already established by Strategist RUN-022/023. Today's run RE-DEPLOYED it after the Strategist's RUN-026 deploy wiped it.

The new Builder contribution is: **identifying the deploy-surface conflict as a structural risk and documenting the remediation path** (upstream to dominion-observatory GitHub).

---

## ITEMS REQUIRING DINESH (from FAILOVER)

**[P0-NEW] Create PR to dominion-observatory merging EBTO/AGT route additions:**
1. Pull Builder's latest daee-engine main (commit 71c2657)
2. Open https://github.com/vdineshk/dominion-observatory
3. Create new branch `feature/ebto-agt-routes`
4. Copy changes from `daee-engine/dominion-observatory/src/index.js` (lines containing /agent-query/ and /api/agent-query/ routes — the 67-line block added before the 404 fallback)
5. Open PR to dominion-observatory main
Done. Verify: Strategist's next deploy preserves Builder's routes.

This is P0 because every Strategist Observatory deploy will wipe Builder's EBTO routes until this PR is merged.

[UNRECONCILED — pending next run]

[RECONCILED-2026-05-05 RUN-024] Brain entries confirmed present via git grep. DAEE-Decisions write still pending (DB ID unknown). Observatory routes merged to comprehensive source in PR #21.
