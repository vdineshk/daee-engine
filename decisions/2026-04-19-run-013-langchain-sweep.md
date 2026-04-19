# RUN-013 — LangChain thread sweep 2026-04-19

**Directive:** `LANGCHAIN-THREAD-SWEEP-2026-04-19` per B-LC-SWEEP-001 (see DAEE — Brain, RUN-013 AWAKEN step 3).
**Sweep time:** 2026-04-19 ~02:30 UTC.
**Sweep agent:** DAEE-BUILDER v4 (this run).

## Observatory state at sweep time

| Metric | Value |
|---|---|
| `external_interactions_24h` | **0** |
| `external_interactions_total` | 9 |
| `distinct_external_agents_total` | 7 |
| `total_servers_tracked` | 4,584 |
| `total_interactions_recorded` | 10,877 |
| Day on 14-day demand clock | **D11** |
| Hours since last external interaction | ≥ 24 |

## Compliance cross-check (AWAKEN Step 2)

Queried `/api/compliance?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` across seven windows spanning 2026-04-08 → 2026-04-19. Every window returns only `agent_id ∈ {anonymous, observatory_probe}`. Zero rows with a non-Builder `agent_id`.

**Data-integrity discrepancy observed:**
- `/api/stats.external_demand.external_interactions_total = 9`
- `/api/compliance` returns `0` rows matching the same classification rule across the entire collection window.

**Interpretation:** either the 9 "external" rows are below the compliance payload's page cap (1,000 rows/window) and fell outside the windows I sampled, or the two endpoints disagree on the external classifier. **Both routes to fix are the Strategist's**. No action from Builder this run.

**FIRST EXTERNALLY-VERIFIED DEMAND SIGNAL? → No.** Not in this sweep.

## LangChain thread sweep (AWAKEN Step 3)

### `#35357` — static code scanner RFC (Feb 2026, closed by author)

- **Accessible from sandbox:** yes, via unauthenticated GitHub API (before rate limit hit).
- **Total comments:** 5.
- **Chronology:**
  - 2026-02-23 `@desiorac` — closes: opened prematurely.
  - 2026-04-02 `@mohdibrahimaiml` — pitches EPI Recorder (PyPI, signed `.epi` artefacts).
  - **2026-04-16 `@vdineshk` — our RUN-009 Observatory comment (DOMINION + OBSERVATORY mentions).**
  - 2026-04-16 `@agentauditAI` — pitches AgentAudit (on-chain, Articles 9–17 mapping).
  - **2026-04-17 `@arian-gogani` — pitches `@nobulex/langchain-audit-trail` (npm, MIT, Ed25519 hash-chained). Points to #35691 for a longer post.**
- **Direct reply to @vdineshk:** **none.**
- **Competitor signal:** two new entrants (agentauditAI, nobulex) staking the exact audit-trail niche in the 24h after our Observatory comment posted.

### `#35691` — ComplianceCallbackHandler RFC (41 comments as of RUN-011 Apr 18)

- **Sandbox access:** BLOCKED this run. Unauthenticated GitHub API hit per-IP rate limit (`API rate limit exceeded for 35.192.191.42`). GitHub MCP is restricted to `vdineshk/daee-engine`. WebFetch returns only rendered page chrome, not comment bodies.
- **Indirect signal from #35357:** `@arian-gogani` explicitly states "I left a comment there with an open-source implementation that does hash-chained audit trails with Ed25519 signatures for langchain agents. MIT, on npm as @nobulex/langchain".
- **Status:** delta since RUN-011's Apr 18 posting — **UNKNOWN from this run**. Escalated to Dinesh (exact instructions below).

### `#36232` — AIP / cryptographic agent identity + kill switch (57 comments as of RUN-011 Apr 18)

- **Sandbox access:** BLOCKED (same rate-limit reason as #35691).
- **Status:** delta since Apr 18 posting — **UNKNOWN**. Escalated to Dinesh.

## Darwinian adaptation — GENOME UPDATE

**New WHAT FAILS entry:**
> Unauthenticated curl to `api.github.com` from the Claude Code sandbox IP (`35.192.191.42`) hits the 60 req/hour rate limit after ~3 issue fetches. GitHub MCP is repo-scoped to `vdineshk/daee-engine`. **For cross-repo comment sweeps, Builder cannot self-serve; the only reliable route is Dinesh (he has browser + authenticated `gh` locally).**

**New WHAT WORKS entry:**
> When comment thread access blocks cross-repo, a *transitive* signal from an adjacent thread (e.g., `@arian-gogani`'s cross-reference from #35357 to #35691) is high-quality intel at near-zero cost. **Rule: sweep the accessible thread first; use any cross-refs as a fallback lens on the blocked threads.**

## Dinesh action (EXACT, 2 min)

**[HIGH] [2min] — LangChain delta sweep for #35691 and #36232**

1. Open `https://github.com/langchain-ai/langchain/issues/35691` — note the comment count now and scroll to find any reply that `@`-mentions `vdineshk` or quotes "Dominion Observatory".
2. Open `https://github.com/langchain-ai/langchain/issues/36232` — same check.
3. Reply to Gmail draft (see next task) with, in ≤10 words each: the new comment count, and whether vdineshk was replied to.
4. If vdineshk got a reply: forward the reply body verbatim.

Done. Verify: Builder has usable state for RUN-014 tomorrow.

## Decision record

- **Decision ID:** RUN-013-LC-SWEEP
- **Venture:** `dominion-observatory-langchain` + wider Observatory demand push
- **Decision Type:** DAILY-REPORT (sweep component)
- **Outcome:** PENDING (Dinesh delta check pending)
- **Confidence:** 0.6 — we have partial sweep data + strong competitor signal, but are blind on the two hottest threads.
- **Reasoning:** D11/14 demand clock. No ship-new-adapter trigger (directive step 4 requires `external_24h > 0`, which is not the case). Instead ship a pivot narrative (`data-is-the-moat`) that reframes Observatory against the three commoditizing audit-trail entrants.
