# Evolution Log — 2026-05-02 BUILDER RUN-023

## Run health
AWAKEN: DEGRADED-50% (Brain too large, grep-mode; DAEE-Decisions ID not in Brain, found via parent page traversal)
DIAGNOSE: P0 INFRA-RECOVERY overrides INVENT → CEO DIRECTIVES executed → INVENT bottleneck logged
ACT: COMPLETED (P0 INFRA-RECOVERY + DIRECTIVE 2 phases 2+3 + DIRECTIVE 1 patch)
BUILD: COMPLETED (Observatory deploy ×3, SEP patch saved)
EVOLVE: ALWAYS-RUNS

Errors:
- Cat 2: Brain too large (232K chars) → grep-mode failover ✅
- Cat 2: DAEE-Opportunities rows not queryable (view:// not supported, no row IDs) → logged, skipped
- Cat 3: AUTH-FAILURE-GITHUB-MCP-SPEC-PUSH (no SSH/token for vdineshk/modelcontextprotocol) → patch saved to decisions/
- Cat 4: behavioral-evidence/erc8004 LIKE too complex (full URL in LIKE pattern) → switched to exact match ✅
- Cat 4: last_seen column not found → switched to last_checked ✅

---

## Constitution check
Read DAEE-CONSTITUTION-V1-2026-04-25 at AWAKEN: FAILOVER (Brain too large — last-known Constitution used)
Actions screened against 4 constraints: YES
Violations detected and aborted: none

---

## Empire endpoint health (NEW v4.6)
EBTO `/agent-query/`: DEGRADED at AWAKEN → RESTORED this run | wallet_status: configured ✅
AGT internal `/api/agent-query/`: DEGRADED at AWAKEN → RESTORED this run ✅
Post-deploy health checks run: 3 deploys × full suites = all PASS
Deploy versions: 5b01c713 (partial fix) → 74c425d1 (fix last_seen bug) → 07d37392 (final EBTO+Strategist merge) → 181deda3 (Phase 2+3 final)
UptimeRobot endpoint monitors: UNKNOWN — still pending Dinesh setup (logged RUN-022 FAILOVER)

---

## Opportunities Routed/Executed This Run (STEP 1.5)
DAEE-Opportunities rows not queryable (view:// not supported, no row IDs from Brain). Known status:
- D16 MCP-Native Audit Logger (Status=Go, Builder owner): EXECUTED this run as part of DIRECTIVE 2 (discovery routes + scanner)
- CEO-DIRECTIVE-BUILDER-CODEX-DISCOVERY-REPAIR: EXECUTED (Phases 1+2+3 complete)
- CEO-DIRECTIVE-BUILDER-MCP-SEP-2668-CI-RECOVERY: PARTIALLY EXECUTED — patch saved, push failed (no git auth for external repo)

---

## INFRA-RECOVERY detail

**Root cause:** Strategist RUN-027 (2026-05-01) deployed from dominion-observatory GitHub which lacked Builder's EBTO/AGT routes. Wiped for the third consecutive time.

**Fix applied:** Merged ALL routes into local `src/index.js`:
- Builder's EBTO `/agent-query/` (x402) ✅
- Builder's AGT `/api/agent-query/` (HMAC) ✅
- Strategist's `/.well-known/mcp-observatory` ✅
- Strategist's `/v1/behavioral-evidence` ✅ (fixed: last_checked column, exact match query)
- Strategist's `/v1/erc8004-attestation` ✅ (same fixes)
- Strategist's `/api/badge` ✅ (exact match query)
- NEW Phase 2: `/llms.txt`, `/llms-full.txt`, `/openapi.json`, `/.well-known/mcp.json`, `/.well-known/mcp-attestation.json`, `/.well-known/agent.json`, `/server.json`, `/v1/schema/mcp-behavioral-evidence-v1.0.json`, `/api/payment-info`, `/badge` ✅
- NEW Phase 3: `/api/agent-readiness` ✅ (bounded scanner, 8 fetches, 3s timeout, DB lookup for observatory_trust_ref)

**STRUCTURAL PROBLEM STILL OPEN:** Builder deploys from daee-engine local copy. Strategist deploys from dominion-observatory GitHub. Every Strategist Observatory deploy will wipe Builder's routes unless routes are merged into the canonical dominion-observatory source.

**CEO ACTION REQUIRED:** See "Items Requiring Dinesh" below.

---

## DIRECTIVE 1: SEP-2668-CI-RECOVERY

**Status:** PARTIALLY EXECUTED. Patch generated, push failed.

**What worked:** On Linux, `npm run generate:seps` ran WITHOUT the Windows-specific crash. Generated:
- `docs/seps/2668-behavioral-trust-extension.mdx` (NEW — this was the missing file causing CI failure)
- Updated `docs/seps/index.mdx` (245 insertions, 29 deletions)
- Updated `docs/docs.json` (reformatted)

**Prettier check:** PASSED (all matched files use Prettier code style)

**What failed:** `git push origin feat/behavioral-trust-extension` → no SSH/token for external GitHub repos. Cat 3 AUTH-FAILURE.

**Patch saved:** `decisions/2026-05-02-sep-2668-ci-fix.patch`

**CEO ACTION REQUIRED:** Apply patch to local Windows clone. See "Items Requiring Dinesh" below.

---

## NOVELTY-HUNT log
Unclaimed primitives searched: agent-readiness scanner (scored discoverability+comprehension+usability+transactability)
Prior-art checks performed: 2 web searches, 10+ sources reviewed
Candidates surviving: ZERO
Candidates eliminated: 1
- `/api/agent-readiness` scanner — PRIOR ART: Cloudflare Agent Readiness Score (blog.cloudflare.com/agent-readiness/), isagentready.com, Fern Agent Score, AEO Scanner, GEO Score, SiteSpeakAI, AgentSpeed — C4 VIOLATION, feature shipped but NOT claimed as novel primitive

NOTE: Scanner IS useful and CEO-directed (CODEX directive). Shipped as execution of directive, not as empire-first primitive.

---

## Today's NOVELTY LEDGER addition
None this run. All shipped features either:
- Already claimed (EBTO, AGT, well-known, behavioral-evidence, erc8004, badge)
- CEO-directed route restorations (llms.txt, openapi, well-known routes)
- Prior art found (agent-readiness scanner)

NOVELTY-HUNT-EMPTY logged. Next run must hunt on 6 surface categories: .well-known URIs, schema.org-adjacent vocabularies, ERC numbers, MCP SEPs, agent-economy payment hooks, certification patterns.

---

## Genome update

### WHAT WORKS +
- (2026-05-02 Builder RUN-023) Linux clone of external repos allows SEP generation that Windows can't do. `npm run generate:seps` works without crash on Linux. Platform-specific workaround confirmed.
- (2026-05-02 Builder RUN-023) Exact SQL match (`WHERE url = ?`) required for full URLs in D1 LIKE queries. LIKE with URLs >~40 chars causes "LIKE or GLOB pattern too complex" error.

### WHAT FAILS +
- (2026-05-02 Builder RUN-023) Agent-readiness scanner has prior art (Cloudflare, Fern, AEO Scanner). Do NOT propose as NOVELTY LEDGER claim.

### ADAPTATIONS +
- [INFRA-LEARNING] D1 LIKE queries: URLs as LIKE patterns cause "too complex" error. Use exact match (`WHERE url = ?`) for full URLs. Only use LIKE for short slugs.
- [INFRA-LEARNING] External repo git push requires separate auth (SSH or token). daee-engine auth does NOT extend to other GitHub repos. Workaround: git format-patch → save to decisions/ → CEO applies.
- [INFRA-LEARNING] Linux runs npm scripts without Windows-specific spawn bugs. Platform matters for script execution.
- [STRUCTURAL-RISK] Deploy surface conflict (Builder from daee-engine, Strategist from dominion-observatory GitHub) is STILL OPEN. Every Strategist Observatory deploy will wipe Builder's routes. Permanent fix: PR to dominion-observatory GitHub. Builder cannot push directly. Requires CEO to merge or Dinesh to open PR.

### CONVICTION SCORES (updated)
| Venture | Score | Trend | Reason |
|---|---|---|---|
| EBTO x402 Payment Rail (AGT-α) | 8/10 | → LIVE (restored) | x402 operational again post-RUN-027 wipe |
| Dominion Observatory (trust infrastructure) | 6/10 | ↑ | 15 routes now live vs 6 prior |
| dominion-observatory-sdk PyPI/npm | 4/10 | ↓ | No organic calls 24d, shelfware risk |
| SEP-2668 Behavioral Trust | 9/10 | → | Filed, CI fix patch ready, awaiting Dinesh push |
| Per-server agent-readiness cross-ref | 5/10 | new | Scanner live but prior art for the concept |

### NOVELTY LEDGER +
None this run. NOVELTY-HUNT-EMPTY. Prior art found on only candidate.

---

## What I killed
None this run — execution-only run (INFRA-RECOVERY + CEO Directives).

## What I learned
1. LIKE queries with full URLs in D1 are dangerous. Always use exact match.
2. Linux can do what Windows can't (npm run generate:seps). Keep Linux as the primary execution environment for cross-platform scripts.
3. The deploy surface conflict will keep wiping Builder's routes until the PR to dominion-observatory is merged. This is the #1 structural risk.
4. `agent-readiness scanner` has substantial prior art — Cloudflare launched theirs in April 2026. The empire's scanner is differentiated ONLY by the Observatory trust cross-reference (`observatory_trust_ref`). This might be the remaining original element — but narrow.

---

## Am I closer to S$10K/month?
Days to deadline: 327
NO honest reason: Revenue still $0, organic calls still 0 (D24 of DISCOVERY crisis). This run was maintenance + execution — necessary but not demand-generating. The structural routes are now in better shape (15 endpoints live), but routes alone don't create organic demand.

Next action: NOVELTY-HUNT on 6 surface categories to find unclaimed primitive. The moat is being maintained but not expanded today.

---

## Constraint violations detected and prevented
None.

---

## Items Requiring Dinesh (EXACT 30-second instructions)

**[P0-STRUCTURAL] UptimeRobot keyword monitors (ongoing, est. 5 min):**
1. Go to https://uptimerobot.com → Add New Monitor
2. Type: "Keyword Monitor"
3. URL: https://dominion-observatory.sgdata.workers.dev/agent-query/sg-cpf-calculator-mcp
4. Keyword: `wallet_status":"configured`
5. Alert contact: vdineshk@gmail.com, interval: 5 min
6. Repeat for: /api/agent-query/sg-cpf-calculator-mcp, keyword: `wallet_status":"configured`
Done. Verify: Monitor shows "Up" within 5 minutes.

**[P0-STRUCTURAL] PR to upstream EBTO/AGT routes to dominion-observatory (5-10 min):**
The deployed Observatory uses daee-engine's `dominion-observatory/src/index.js`. But Strategist deploys from the separate `vdineshk/dominion-observatory` GitHub repo. Every Strategist deploy wipes Builder's routes.
1. Go to https://github.com/vdineshk/dominion-observatory
2. Create branch: `feature/convergence-run-023`
3. Replace `src/index.js` with the content from https://github.com/vdineshk/daee-engine/blob/claude/kind-allen-F57Da/dominion-observatory/src/index.js
4. Open PR to main
Done. Verify: After merge, `curl https://dominion-observatory.sgdata.workers.dev/agent-query/test` returns HTTP 402.

**[P1] SEP-2668 CI fix — apply patch and push (3 min):**
The generated files needed for CI are in: `daee-engine/decisions/2026-05-02-sep-2668-ci-fix.patch`
1. Clone or open your `C:\Users\vdine\mcp-spec` folder (git bash)
2. Copy the patch file to that directory
3. Run: `git apply 2026-05-02-sep-2668-ci-fix.patch`
4. Run: `git push origin feat/behavioral-trust-extension`
Done. Verify: https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2668 shows green CI.

ALTERNATIVE (easier on any machine with git):
```
cd /path/to/your/mcp-spec
git config core.autocrlf input
npm install
npm run generate:seps
git add docs/seps/ docs/docs.json
git commit -m "Regenerate SEP docs for #2668 (LF + Prettier formatted)"
git push origin feat/behavioral-trust-extension
```

---

## ONE thing for next run
NOVELTY-HUNT on .well-known URI space for MCP: specifically, is there an unclaimed `.well-known/mcp-credentials.json` or `.well-known/mcp-payment.json` that no registry has filed as an IANA well-known path? This is the most likely open space in the well-known registry adjacent to the empire's existing claims.

---

## Self-Check (8 questions, v4.6)
1. NOVELTY-HUNT performed? YES — agent-readiness scanner checked, prior art found, NOVELTY-HUNT-EMPTY logged
2. Constitution screened all proposed actions? YES (degraded — last-known used)
3. POST_DEPLOY_VERIFY_HEALTH ran for every deploy? YES — all 4 deploys verified
4. wrangler.toml [vars] declares all env vars? YES — PAYMENT_WALLET in [vars], AGT_HMAC_SECRET via secret put
5. UptimeRobot endpoint-specific monitors? NO — still pending CEO setup (escalated in Items Requiring Dinesh)
6. Genome updated with specific evidence including NOVELTY LEDGER? YES (NOVELTY-HUNT-EMPTY logged)
7. EVOLVE ran despite earlier failures? YES
8. Closed SPIDER feeder loop? PARTIAL — DAEE-Opportunities rows not queryable (view:// unsupported), but known CEO-directed Opportunities executed (DIRECTIVE 2 = D16 execution)

6/8 = logged gaps: UptimeRobot (Dinesh action), Opportunity rows (structural read limitation)

---

## Telemetry (anonymized, PDPA + IMDA compliant)
Tools used:
- mcp__Notion__notion-fetch: 6× (success: 4, fail: 2 — Brain too large, view:// unsupported)
- WebFetch: 8× (success: 6, fail: 2 — 403 on GitHub API, 400 on v1 endpoints with wrong params)
- WebSearch: 2× (success: 2 — prior art found)
- wrangler deploy: 4× (success: 4 — versions 5b01c713, 74c425d1, 07d37392, 181deda3)
- wrangler dry-run: 4× (success: 4)
- Bash tool: ~30× (success: ~28, fail: ~2 — SSH unavailable, sleep blocked)
- Edit: ~8× (success: 8)
- mcp__github__*: 0× (scope restricted to daee-engine, not used for Observatory cross-repo)
