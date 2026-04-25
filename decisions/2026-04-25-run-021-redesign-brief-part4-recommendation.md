# Redesign Brief Part 4 — Recommendation + New Pre-Commitment
**RUN-021 — 2026-04-25 (D19)**

---

## Recommendation

**Run Option C as primary lever; Option A as the warm-leads channel that funnels into C. Park Option B until C produces signal.**

### Why C is primary

1. **Most direct path to S$10K/mo.** 5 enterprise pilots × S$2K = S$10K. No conversion cliff between "signal" and "revenue" — a signed pilot IS the revenue.
2. **Cleanest asset-buyer match.** The asset (the dataset) is precisely what the buyer (compliance/audit/registry) needs. No re-framing required.
3. **Honest about provenance.** The bulk of the 25,641 rows is internally generated. C's pitch acknowledges this directly ("probe-derived behavioral telemetry, transparently sourced") and turns it into a differentiator. A and B both implicitly assume external-call volume that doesn't exist, which is fragile under buyer scrutiny.
4. **Lowest human-gated critical path.** Three cold emails over 4 weeks is a single Dinesh batch. No 5-msgs/week ongoing rhythm needed (which would re-create the HN-gate failure mode).
5. **Compounds with the existing assets.** All current infrastructure (Observatory, SDK, servers, registry listings) becomes either ingestion path or proof-of-coverage, instead of a sunk-cost discovery layer.

### Why A is the warm-channel companion

The per-server `/benchmark/{server-name}` page is also useful as a **pre-sales artifact for C**. When Dinesh emails a compliance vendor, the email links to a sample server's public benchmark page as proof the data is real. The benchmark pages exist for a reason that pre-dates the cold email; they are not a sales gimmick.

Therefore: build the per-server endpoint anyway (small engineering lift, ~1 day), use it as both (1) a passive vendor-discovery surface for Option A and (2) a proof artifact for Option C's outbound emails.

### Why B is parked

Option B is high-value if it lands but high-variance. The 9 LangChain PRs (4 partial slot-fills, 0 merges) prove that ecosystem-PR motion produces engagement but not merges at our current credibility level. Re-running that motion against MCP-server maintainers without first having paid customers as social proof is unlikely to land. Park B until at least one paid pilot from C is signed; then the email subject line "MCP-server quality benchmark used by {paying customer}" is enough to unlock the merge gate.

---

## What this run (RUN-021) actually ships toward C

**Reminder of v4.1 Rule 1:** every artifact is committed AS WRITTEN. The remaining run-time after this brief is bounded; what gets shipped is what gets committed. The remaining items below are sequenced by leverage.

### MUST ship before EVOLVE phase (next ~30 minutes of run-time)

1. **`DINESH-READ-ME.md` refresh** — D16 → D19, redesign brief surfaced, HN gate explicitly de-prioritized, three new EXACT-instructions tasks (one of them is the cold-email batch from C).
2. **`benchmarks/sample-report-2026-04.md`** — first cut of the wedge artifact for C. Stats from real `/api/stats` data + commentary on five named MCP servers' behavioral profiles. This is the artifact Dinesh links from the cold emails.
3. **Daily EVOLVE report** — captures what shipped, what didn't, why.

### MAY ship if run-time allows

4. **`outreach/2026-04-25-c-cold-email-templates.md`** — three drafted cold emails for the three named buyer archetypes (compliance vendor, audit-firm partner, registry maintainer), copy-paste ready for Dinesh.

### EXPLICITLY deferred to RUN-022

5. New `/benchmark/{server-name}` Cloudflare Worker endpoint and `/dataset` landing page. Cloudflare deploys are guarded by `wrangler dry-run` discipline and need verification time the v4.1 incremental-commit window doesn't cleanly afford this run.
6. `/sample-report.pdf` (PDF rendering of the markdown wedge artifact) — only if Dinesh requests; the markdown is sufficient for v1 outreach.

This sequencing is honest: the highest-leverage artifact (the sample report) ships this run; the engineering follows next run with proper dry-run discipline.

---

## NEW PRE-COMMITMENT (replaces RUN-018 pre-commitment, which has now executed)

> **The Builder pre-commits to the following kill-criteria. They are written here so future runs can read them and act mechanically.**

### Pre-commitment P-021A — Sample Report ships
- **Trigger:** RUN-021 (this run).
- **Action:** `benchmarks/sample-report-2026-04.md` is committed and pushed before EVOLVE phase.
- **Status:** **MUST SATISFY THIS RUN.** If RUN-021 ends without this file committed, RUN-022 escalates to Dinesh that the v4.1 incremental-commit protocol failed and a deeper Builder issue exists.

### Pre-commitment P-021B — Cold-email batch sent
- **Trigger date:** D26 (2026-05-02, 7 days from now).
- **Required by D26:**
  - `/benchmark/{server-name}` endpoint live on Observatory worker.
  - `/dataset` landing page live (Cloudflare Pages or Worker route).
  - Three drafted cold emails in `outreach/` directory.
  - Builder has produced exact copy-paste instructions for Dinesh to send the three emails.
- **Action by D26:** Dinesh sends the three emails. (One human-gated step.)
- **Discriminator:** by D26 + 7 days (= D33, 2026-05-09), at least one reply or one out-of-office bounce confirming delivery.

### Pre-commitment P-021C — Conversion or kill
- **Trigger date:** D47 (2026-05-23, 28 days from now).
- **Pass condition:** at least ONE booked exploratory call OR ONE signed paid pilot (any tier, any S$ amount) from the three contacted buyers OR from inbound prompted by the public benchmark pages.
- **Fail action:** if 0 calls booked AND 0 paid pilots AND 0 inbound replies → KILL Option C. Escalate to Dinesh with this brief, the four parts of redesign, the daily reports for D19→D47, and a request for full strategic reset (which may include sunsetting the Observatory direction entirely).
- **Honesty check:** "out-of-office" replies and "thanks but no" replies count as REPLIES, not as bookings. Only an actual call-booked or pilot-signed satisfies the pass condition.

### Pre-commitment P-021D — Hard stop on prior strategy
- **Trigger:** RUN-021 forward.
- **Action:** No new long-form content piece written until P-021C resolves. No new registry-submission preparation. No new SDK ecosystem PRs. Existing assets keep running; no new investment in the discovery-layer thesis until a paying customer validates the dataset thesis.
- **Override condition:** if `external_interactions_24h` rises above 5 organically (without Builder triggering it), Builder may resume content investment as a secondary lever. Until then, content is dead investment.

---

## Telemetry disclosure

This brief was written across 4 incremental git commits per v4.1 Rule 1, specifically to survive any stream-timeout that might fire mid-write (as happened in RUN-020). If this paragraph is being read in a future run, either (a) no timeout fired and the brief landed cleanly, or (b) a timeout fired and at least the parts up to the timeout are preserved in git history. Either outcome is acceptable.

— DAEE-BUILDER v4.1, RUN-021, branch `claude/hopeful-davinci-cRTZU`
