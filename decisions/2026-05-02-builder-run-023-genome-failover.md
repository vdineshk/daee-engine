# BUILDER RUN-023 GENOME FAILOVER — 2026-05-02

## Status
Cat 2 DEGRADED-CHANNEL — Brain page (33c017e7-fcf2-81cd-aff1-ca2988520c09) too large (232K chars).
`notion-update-page` timed out after 60s on both a 4-update batch and a single-update call.

[UNRECONCILED — pending next run]

---

## Target
DAEE-Brain `33c017e7-fcf2-81cd-aff1-ca2988520c09`, BUILDER GENOME section.

### Verified: RUN-022 FAILOVER already reconciled
Checked Brain content this run — the following RUN-022 entries ARE PRESENT in Brain:
- `(2026-05-01 Builder RUN-022) EBTO/AGT routes re-deployable without GitHub access` — IN BRAIN ✅
- `(2026-05-01 Builder RUN-022) wrangler secret put immediately live` — IN BRAIN ✅
- `(2026-05-01 Builder RUN-022) Strategist deploy wipes Builder's Observatory routes` — IN BRAIN ✅

File `decisions/2026-05-01-builder-run-022-FAILOVER.md` can be marked RECONCILED.

---

## WHAT WORKS — entries to append after:
`"Pattern: every revenue endpoint needs a machine-readable expected-state spec committed to git alongside the code."`

```
- **(2026-05-02 Builder RUN-023) Linux clone of external repos allows SEP generation that Windows can't do.** `npm run generate:seps` runs without Windows-specific spawn bugs on Linux. Platform-specific workaround confirmed. Rule: use Linux (daee-engine) as primary execution environment for cross-platform npm scripts.
- **(2026-05-02 Builder RUN-023) Exact SQL match required for full URLs in D1 queries.** `WHERE url = ?` (exact) instead of `WHERE url LIKE ?` (`%url%`). D1 LIKE with URLs >~40 chars causes "LIKE or GLOB pattern too complex" error. Only use LIKE for short slugs. Applied to /v1/behavioral-evidence, /v1/erc8004-attestation, /api/badge.
```

---

## WHAT FAILS — entry to append after:
`"Git is truth; Notion is not optional convenience — it is the CEO's live view."`

```
- **(2026-05-02 Builder RUN-023) Agent-readiness scanner has prior art.** Cloudflare launched Agent Readiness Score (Apr 2026), plus isagentready.com, Fern Agent Score, AEO Scanner, GEO Score. Do NOT propose /api/agent-readiness as NOVELTY LEDGER claim. Only original element: Observatory trust cross-reference (`observatory_trust_ref` from D1).
```

---

## ADAPTATIONS — entries to append after:
`` "`wrangler --config dominion-observatory/wrangler.toml deploy` is the alternative if CWD is elsewhere." ``

```
- **(INFRA-LEARNING-2026-05-02-A) D1 LIKE queries with full URLs cause "too complex" error.** Use exact match (`WHERE url = ?`) for full URLs. Only use LIKE for short slugs (<~40 chars). Applies to all routes that receive a URL as a query parameter.
- **(INFRA-LEARNING-2026-05-02-B) External repo git push requires separate auth.** daee-engine credentials do NOT extend to other GitHub repos (e.g., vdineshk/modelcontextprotocol). Workaround: `git format-patch` → save to decisions/ → CEO applies. Zero retries on Cat 3 AUTH-FAILURE.
- **(INFRA-LEARNING-2026-05-02-C) Linux runs npm scripts without Windows-specific spawn bugs.** `npm run generate:seps` crashes on Windows but works on Linux. Platform matters for script execution. Use Linux for cross-platform scripts.
- **(STRUCTURAL-RISK-2026-05-02) Deploy surface conflict Builder ↔ Strategist STILL OPEN.** Builder deploys from daee-engine local. Strategist deploys from dominion-observatory GitHub. Every Strategist Observatory deploy will wipe Builder's routes until PR to dominion-observatory is merged. Every Builder AWAKEN must re-verify EBTO+AGT health until resolved.
```

---

## CONVICTION SCORES — entry to append after:
`"LangChain PR sweep: 2/10 ↓ FLAG-KILL (proved zero merge channel). 3-piece content + HN draft: 2/10 ↓ FLAG-KILL P-021D."`

```
- **(2026-05-02 Builder RUN-023 UPDATE)** EBTO x402 Payment Rail (AGT-α): **8/10** → LIVE (restored post-RUN-027 wipe, 4th wipe total). Dominion Observatory (trust infra): **6/10** ↑ (15 routes live vs 6 prior). dominion-observatory-sdk PyPI/npm: **4/10** ↓ (no organic calls 24d, shelfware risk). SEP-2668 Behavioral Trust: **9/10** → (filed, CI fix patch ready, awaiting Dinesh push). Per-server agent-readiness scanner: **5/10** NEW (live but prior art for concept; differentiated only by observatory_trust_ref). NOVELTY-HUNT-EMPTY this run.
```

---

## NOVELTY LEDGER
NOVELTY-HUNT-EMPTY this run. No new primitive claimed. Prior art found on only candidate (agent-readiness scanner). No LEDGER entry to append.

---

## Next run instruction
At AWAKEN, try Brain GENOME updates with single small `update_content` calls. If timeout recurs, escalate to CEO to manually apply this file OR consider archiving older Brain content to the archive page (34f017e7-fcf2-81e1-a6db-e58f746182c9) to reduce Brain size below 200K chars.
