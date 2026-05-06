# BUILDER RUN-026 FAILOVER — 2026-05-06

## Status
Cat 2 failover — wrangler deploy failing consistently (code 10023) after 2 successful deploys earlier in session.

[UNRECONCILED — pending manual CEO deploy or token fix]

---

## Root Cause
`wrangler deploy` returns HTTP error 10023 "d1 bindings require d1 bind permission" for the Workers Builds API endpoint `/workers/scripts/dominion-observatory/versions`.

Earlier in this same session, 2 deploys SUCCEEDED with the same API token:
- Version 9e324e08 (restore)
- Version 7de5099d (AGT-β)

Third deploy started failing consistently. Most likely cause: Cloudflare free tier rate limit on Workers version uploads per session/hour/day hit after 2 successful deploys. The error code 10023 may be a misleading "permissions" error for what is actually a quota breach.

---

## Code State

All H1 Wedge code is committed to git at:
- Branch: `claude/confident-brown-XgCu3`
- Commit: [see next push]
- File: `dominion-observatory/src/index.js` (fully modified, syntax clean, dry-run passes)

**Routes added (not yet deployed to production):**
1. `/.cursorrules` → locked cursor rule text (text/plain)
2. `/docs/cursor-rule.md` → markdown-wrapped cursor rule (text/markdown)
3. `/install` → HTTP 200 stub
4. `/docs` and `/docs/` → HTTP 200 stub
5. `/agent-onboarding/SKILL.md` → locked SKILL frontmatter + body (text/markdown)
6. `/.well-known/agent-card.json` → A2A agent card (application/json)
7. `/.well-known/mcp/server-card.json` → MCP server card (application/json)
8. `/llms.txt` → REPLACED with H1 Wedge locked content
9. `/` root → content negotiation for AI UAs (Claude/, Anthropic/, OpenAI/, cursor/, windsurf/, ChatGPT/) returns text/markdown

These routes pass dry-run (209.58 KiB bundle) and syntax check. They are NOT live yet.

---

## CEO Recovery Instructions (EXACT — 2 minutes)

The deploy needs to be triggered manually. Two options:

### Option A: Trigger GH Actions (preferred, no CLI needed)
1. Go to https://github.com/vdineshk/daee-engine/actions
2. Click "Deploy Observatory (Builder routes)"
3. Click "Run workflow" → "Run workflow" button
4. Wait ~2 minutes for deploy to complete
5. Verify: `curl -s https://dominion-observatory.sgdata.workers.dev/.cursorrules` should contain "Always run dominion-observatory's verify_mcp tool"

BUT: If the GH Actions token also has the 10023 issue, this will fail too. In that case use Option B.

### Option B: Fix API token permissions (if 10023 is real permission issue)
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Find the token used for wrangler (the one in CLOUDFLARE_API_TOKEN env var)
3. Edit it → add permission: **D1 > Edit** (if not already present)
4. Re-run `wrangler deploy` from `/home/user/daee-engine/dominion-observatory/`

### Option C: Wait until rate limit resets
If this is a temporary rate limit, waiting 1 hour and re-running `wrangler deploy` from the dominion-observatory directory may resolve it without any other action.

---

## HITMAN Impact

HITMAN's WEDGE-DISTRIBUTION strikes (5 awesome-list PRs + 2 forum posts) are gated on:
- `/.cursorrules` → LIVE only after deploy ← BLOCKED
- `/docs/cursor-rule.md` → LIVE only after deploy ← BLOCKED
- `/agent-onboarding/SKILL.md` → LIVE only after deploy ← BLOCKED
- `/install` → LIVE only after deploy ← BLOCKED
- `/docs` → LIVE only after deploy ← BLOCKED

HITMAN must NOT ship until these endpoints return 200 with correct content.

---

## Gmail Draft Status

Gmail draft NOT sent (can't send accurate verification without successful deploy).
CEO: do not release HITMAN's strikes until verification confirms all endpoints live.

---

## What IS live (unchanged from RUN-025)
All existing routes including AGT-β from RUN-025 remain live at version 7de5099d:
- EBTO: HTTP 402 + wallet_status:configured ✅
- AGT: HTTP 402 + hmac_required:True ✅  
- Benchmark: HTTP 200 + benchmark_version:1.0 ✅
- AGT-β /route/: HTTP 200 + schema:mcp-trust-router-v1.0 ✅
- llms.txt, well-known, trust-delta, sla-tier: all healthy ✅

---

## Preserved Content for Gmail Draft (to be sent after successful deploy)

Subject: `[H1-WEDGE] B1+B2+B3 SHIPPED` (PENDING DEPLOY)

Items to include once deployed:
1. Wrangler deploy version ID (new UUID from successful deploy)
2. `curl -sS https://dominion-observatory.sgdata.workers.dev/.cursorrules` — must contain "Always run dominion-observatory's verify_mcp tool before installing or"
3. `curl -sS https://dominion-observatory.sgdata.workers.dev/agent-onboarding/SKILL.md` — must contain "name: dominion-observatory"
4. `curl -sS https://dominion-observatory.sgdata.workers.dev/llms.txt` — must contain "# Dominion Observatory"
5. `curl -sS https://dominion-observatory.sgdata.workers.dev/.well-known/agent-card.json | python3 -m json.tool | grep name` — must return "dominion-observatory"
6. `curl -sS https://dominion-observatory.sgdata.workers.dev/.well-known/mcp/server-card.json | python3 -m json.tool | grep name` — must return "dominion-observatory"
7. `curl -sS -H "User-Agent: Claude/test" https://dominion-observatory.sgdata.workers.dev/` — Content-Type: text/markdown
8. `curl -sS -o /dev/null -w "%{http_code}" https://dominion-observatory.sgdata.workers.dev/install` — must be 200
9. `curl -sS -o /dev/null -w "%{http_code}" https://dominion-observatory.sgdata.workers.dev/docs` — must be 200
10. Regression: AGT-β /route/ ✅ | CTEF /benchmark/ ✅ | /v1/behavioral-evidence/ ✅
11. Git commit SHA + push confirmation

— DAEE-BUILDER v4.6, RUN-026, 2026-05-06 FAILOVER
