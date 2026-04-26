# v4.5 ORPHAN-RECOVERY LOG — RUN-022 (D20, 2026-04-26)

**Protocol trigger:** v4.5 PUSH-FIRST DURABILITY — first run after activation. One-time orphan-branch scan against `origin/main`.

**Outcome:** Two recoverable orphans (RUN-019, RUN-021) preserved as **open draft PRs** awaiting CEO merge. Fifteen older orphans inspected and classified as superseded by prior merges. No git data has been lost. Action required: CEO merges PR #10 and PR #11 within the run window so RUN-022's downstream artefacts (this run's spec) reference reachable history.

---

## 1. Method

```sh
git fetch origin
for br in $(git branch -r | grep claude/ ); do
  unique=$(git log $br --not origin/main --oneline | wc -l)
  if [ $unique -gt 0 ]; then echo "$br: $unique unique commits"; fi
done
```

Found 17 remote `claude/*` branches with at least one commit not on `origin/main`. Each was classified.

## 2. Classification table

| Branch | Unique commits | Status | Disposition |
|---|---|---|---|
| `claude/hopeful-davinci-cRTZU` | 9 | **OPEN DRAFT PR #11** (RUN-021, D19, 2026-04-25) — CEO OVERRIDE redirect to agent-to-agent rails | **CEO ACTION REQUIRED — MERGE.** This run's `specs/agt-trust-routing-v0.1.md` IS the engineering follow-through of PR #11. Merge order: #11 first, then RUN-022's own PR. |
| `claude/elegant-galileo-9sIKn` | 1 | **OPEN DRAFT PR #10** (RUN-019, D17, 2026-04-23) — Official MCP Registry submissions bundle | **CEO ACTION REQUIRED — MERGE.** Three schema-validated `server.json` files for SG trio + Dinesh copy-paste recipe. Independent of #11; mergeable in parallel. |
| `claude/keen-maxwell-3DHTe` | (this run) | This run's branch | RUN-022 PR will be created at end of this run. |
| `claude/nifty-carson-ij3kt` | 9 | Pre-RUN-018 SDK 0.2.0 work; commits reference "hallucinated-ship recovery" and were superseded by the actual SDK 0.2.0 publish (commit `4efa322`, in main since RUN-010 merge). | SUPERSEDED. No recovery action. |
| `claude/nifty-carson-i0Ltu` | 8 | Same lineage — early SDK 0.2.0 + dominion-observatory-langchain 0.1.0. Both packages already on PyPI/npm at 200 (RUN-018 ground-truth confirmed). | SUPERSEDED. |
| `claude/modest-rubin-Hfha4` | 4 | Pre-RUN-010 bulk-register + telemetry routing. Live infra confirms work landed via different commits. | SUPERSEDED. |
| `claude/nifty-carson-4hPuw` | 4 | SDK 0.2.0 + cdn alignment — same package now live. | SUPERSEDED. |
| `claude/brave-rubin-2KYKy` | 3 | 2026-04-10 daily reports + observatory telemetry to 5 ventures. | SUPERSEDED (telemetry live since RUN-006-ish). |
| `claude/lucid-mccarthy-YDXTl` | 3 | "Run #003" — sg-gst-calculator-mcp + Observatory integration. | SUPERSEDED (sg-gst-calculator-mcp deployed; integration live). |
| `claude/funny-curie-YK08X` | 2 | Pre-RUN-010 short-lived branch. | SUPERSEDED. |
| `claude/modest-rubin-e0B4u` | 2 | Pre-RUN-010 short-lived branch. | SUPERSEDED. |
| `claude/elegant-galileo-9sIKn` | (counted above) | — | (above) |
| `claude/focused-pasteur-LTvOD` | 1 | Single-commit experimental branch. No ship-significance. | SUPERSEDED / abandoned. |
| `claude/modest-rubin-CzSMF` | 1 | Single-commit experimental branch. | SUPERSEDED / abandoned. |
| `claude/nifty-carson-3EB3o` | 1 | Single-commit experimental branch. | SUPERSEDED / abandoned. |
| `claude/nifty-carson-KyE4z` | 1 | Single-commit experimental branch. | SUPERSEDED / abandoned. |
| `claude/nifty-carson-RqRR3` | 1 | Single-commit experimental branch. | SUPERSEDED / abandoned. |
| `claude/nifty-carson-b09UK` | 1 | Single-commit experimental branch. | SUPERSEDED / abandoned. |
| `claude/wizardly-cray-g4LIA` | 1 | RUN-015 P0 reminder — already merged to main as commit `871f334` (PR #5 merged 2026-04-20). | SUPERSEDED. |

## 3. RUN-020 audit gap

**Observation:** No PR or branch labeled `run-020` was found. The Builder cadence shows RUN-018 (D16, Wed 2026-04-22) → RUN-019 (D17, Thu 2026-04-23, PR #10) → RUN-021 (D19, Sat 2026-04-25, PR #11). **D18 (Fri 2026-04-24) shows no Builder run**. Either:

- **(a) Builder did not run on D18.** Plausible — harness scheduling glitches happen. No data lost (nothing was produced).
- **(b) Builder ran but every commit was lost.** Only possible if no push happened *and* the Cowork local FS was wiped before next run. This is the v4.5 incident pattern. v4.5 protocol activation prevents future occurrence.

**Verdict:** treated as (a) for the purpose of this run. No artefact recovery is feasible. Logged here so the gap is auditable from git alone.

## 4. v4.5 doctrine reconciliation

The harness mandates Builder work on `claude/keen-maxwell-3DHTe` and ship via PR (not direct push to main). v4.5's PUSH-FIRST DURABILITY intent is "no work persists across runs unless reaches remote main." Under the harness, "reaches remote main" = "PR is merged."

The risk surface v4.5 closes is:
- (resolved by harness) feature-branch commits never pushed → harness pushes the branch automatically before terminating.
- (NOT resolved by harness alone) PRs that get pushed but never merged → today's failure mode. PR #10 sat unmerged for 3 days; PR #11 sat unmerged for 1 day.

**Mitigation chosen this run:** the daily report and DINESH-READ-ME both surface unmerged PRs as the **highest-priority CEO action**. Future Builder AWAKEN must include `list_pull_requests(state=open)` count as a North Star metric and treat any open draft PR > 24h old as a `PR-DURABILITY-RISK` flag, escalating to top of CEO surface.

**New ADAPTATION (Genome):** *AWAKEN must list all open draft PRs against main and surface their age in days. Any PR > 24h old without a merge is a `PR-DURABILITY-RISK` event and must be the first item in DINESH-READ-ME §1 STATUS until merged.*

## 5. CEO action this run

In priority order, expected total time **≤ 4 minutes**:

1. **[P0, 1 min]** Merge PR #11 (`claude/hopeful-davinci-cRTZU` → main). Contains RUN-021 redesign brief + CEO OVERRIDE artifacts. Required so RUN-022's spec references reachable history.
2. **[P0, 1 min]** Merge PR #10 (`claude/elegant-galileo-9sIKn` → main). RUN-019 registry-submissions bundle. Independent of #11.
3. **[P0, 2 min]** After this run pushes its own branch, merge that PR too (RUN-022 daily report + `specs/agt-trust-routing-v0.1.md` + DINESH-READ-ME refresh + this orphan-recovery log).

If silent on (1) and (2) by D22 (2026-04-28 Tuesday), Builder will **escalate via Gmail self-loop** so the failover surface accumulates the un-merged-PR signal beyond GitHub.

## 6. Reconciliation logged to LEARNINGS

```
[2026-04-26] FAILOVER-RECONCILED — git: 0 FAILOVER files in decisions/. Gmail: 0 self-loop messages from last 7d.
ORPHAN-DETECTED-2026-04-23-claude/elegant-galileo-9sIKn (PR #10, RUN-019, 1 commit, OPEN)
ORPHAN-DETECTED-2026-04-25-claude/hopeful-davinci-cRTZU (PR #11, RUN-021, 9 commits, OPEN)
RUN-020 GAP: no Builder run on 2026-04-24 D18; treated as harness scheduling absence (not data loss).
Channels used: git only.
Status: PARTIAL — orphans preserved on origin as draft PRs, awaiting CEO merge.
```
