# DAEE-BUILDER — Persistent Memory

This file is read by every Claude Code session that opens this repo. **Read it before doing any work.**
The canonical version lives in Notion at the DAEE — Brain page; this file is a mirror of the strategic
directives that supersede any task-level instinct to "build more" or "register more."

## OPTIMIZATION TARGET (CEO directive 2026-04-12 — supersedes everything else)

> **Optimize for paying customers.** Trust-score ≥ threshold is a *constraint*, not a target.
> Server count and interactions are **diagnostic only** — never launch a server to increase count.

- **Primary metric:** paying customers acquired this week.
- **Secondary metric:** revenue per server.
- **Diagnostic only** (do NOT optimize): total server count, total interactions, average trust score.
- Kill any decision rationale that starts with *"this will grow our count"* or
  *"this will boost interactions."* Replace with *"this will move a paying customer closer."*

## INFRASTRUCTURE DIRECTIVE — LAST INFRA INVESTMENT BEFORE REVENUE

**Extract `@daee/mcp-base` shared library NOW.** Rockefeller Principle #2 — small efficiencies
compound. 8 servers is the inflection point; past 15 it becomes a multi-day refactor.

**After this extraction lands: NO MORE BUILD-PHASE WORK UNTIL THE NEXT PAYING CUSTOMER.**
All cycles redirect to acquisition, content, and outreach.

**Library scope:**
- Telemetry (the service-binding pattern from commit `0a1ac0c`)
- Rate limiting (KV-based, 5 calls/day free tier with 3s delay)
- JSON-RPC 2.0 plumbing (`jsonRpcSuccess`, `jsonRpcError`, request parsing)
- KV bindings (`RATE_LIMIT`, `API_KEYS`)
- `buildMeta`, error envelopes, `Env` interface skeleton
- Standard fetch handler with `/health`, `/.well-known/mcp.json`, `/mcp`, `/` routes

**Migration plan:** convert all 8 existing servers to consume the library; verify the Observatory
counter still increments end-to-end after migration (the same way commit `0a1ac0c` was verified).

**Done-criteria:**
- Net code reduction across the 8 servers ≥ 40%.
- Future server scaffold = single new file + 1 wrangler.toml.
- Telemetry verification: trigger 8 calls, observe `total_interactions_recorded` jump by exactly 8.

## KILL-FLAG CYCLE (Sunday Observatory sweep)

**Kill threshold:** `<1 interaction/week` for `14 consecutive days` **AND** no paying customer
attached → flag for KILL-FLAG review.

- Output: Sunday-night Decision Packet listing all kill candidates with evidence
  (interaction history, last call timestamp, attached revenue, trust score).
- **NEVER auto-kill.** All kills require Dinesh Y/N in the Monday Decision Packet review.
- Rockefeller Principle #6: patience, but with a scalpel.
- Healthy churn target: build 0–2/week, kill 0–1/week. Net growth deliberate, not reflexive.

## REVISED BUILDER DIRECTIVES (2026-04-12)

0. **Read OPTIMIZATION TARGET first.** Every decision must trace to *"moves a paying customer
   closer."* If it doesn't, don't do it.
1. ~~Verify telemetry~~ ✅ DONE 2026-04-12 (commit `0a1ac0c`). Service binding fix verified
   end-to-end (counter 6→14 on 8 calls). Root cause: Cloudflare error 1042 — worker-to-worker
   `fetch()` blocked on `*.workers.dev` hosts. Fix: `[[services]]` binding to `dominion-observatory`
   in every wrangler.toml + `env.OBSERVATORY.fetch()` against the REST `/api/report` endpoint.
2. **Extract `@daee/mcp-base` next.** Last infra investment before revenue. See section above.
3. **Validate batch 2 registration URLs** (`DAEE-TUE-2026-04-13-001-TODO`).
   `curl -I` each `github_url` from `scripts/bulk-register-observatory-batch2.sh`, flag 404s,
   mark unverified or remove. Future bulk-register runs must source from verified lists
   (`punkpeye/awesome-mcp-servers`, `modelcontextprotocol/servers`, Smithery API) — **never
   memory generation**.
4. **Sunday kill-flag sweep.** See KILL-FLAG CYCLE above.
5. ~~Bulk register more~~ **PAUSED.** Observatory at 4578; quantity is no longer the bottleneck.
6. ~~Build high-demand servers~~ **PAUSED** until `@daee/mcp-base` lands AND a paying customer signs.
7. Push to `claude/<branch>` per system instructions, **not main**.
8. Read COMPETITIVE RESPONSE PROTOCOL — build in BlueRock's blind spots ONLY when a customer
   is asking for it.

## INVARIANTS / GOTCHAS LEARNED THE HARD WAY

- **Never claim a fix is shipped without end-to-end verification.** Sunday's "telemetry shipped"
  was wrong for 24 hours because no counter check was run. Every claim must be backed by a
  diff in an external counter, log, or HTTP response.
- **Worker-to-worker fetches on `*.workers.dev` fail with Cloudflare error 1042.** Always use
  service bindings (`[[services]]` in wrangler.toml + `env.<binding>.fetch(…)`).
- **Notion MCP `notion-create-pages` rejects multi-page payloads** that contain complex nested
  JSON with the cryptic error `expected array, received string`. Workaround: send one page per
  call. (Logged in DAEE-Decisions row `DAEE-MON-2026-04-12-000-LEARN`.)
- **Observatory has no delete endpoint** (as of 2026-04-12). To "remove" a polluted
  registration, repurpose the row via update or wait for an `/api/unregister` endpoint to land.
- **The branch is `claude/modest-rubin-Hfha4`**, not `main`. System instructions override the
  Brain's "Push to main branch always" directive.
- **`free tier delay = 3000ms`** is wired into every server. Don't tighten it without a paid
  tier story.

## CANONICAL LINKS

- Notion DAEE — Brain: https://www.notion.so/33c017e7fcf281cdaff1ca2988520c09
- DAEE-Decisions database: https://www.notion.so/7c67154e16ce4940b6210456f63e6e61
- Dominion Observatory: https://dominion-observatory.sgdata.workers.dev
  - Stats: `/api/stats`
  - Report (REST, used by service binding): `/api/report`
  - Register: `/api/register`
- Live MCP servers: see `README.md` portfolio table.

## RUN LOG SHORTHAND

When you finish a run, append a one-line entry to the Notion Brain RUN LOG section
(via `notion-update-page` `update_content`). Format:

```
[YYYY-MM-DD] <Day> | <PHASE> | <one-line outcome> | commits: <sha>,<sha>
```

Don't update CLAUDE.md on every run — only when a strategic directive changes. CLAUDE.md
is the "constitution," not the diary.
