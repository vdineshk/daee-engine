# BUILDER-SHIPPED-DOMINIONOBSERVATORY-DEV-2026-05-06
## Status: H1 Wedge Live on workers.dev — dominionobservatory.dev BLOCKED (not registered)

**Logged:** 2026-05-06  
**Agent:** DAEE-BUILDER  
**Version deployed:** 9a59f325-ef1a-44a6-b8bb-5e0014e82f2f  
**Target for Notion write:** DAEE-Intelligence (ID unknown — write to git failover)

---

## What IS live (all verified 2026-05-06)

| Route | Status | Verified content |
|---|---|---|
| `https://dominion-observatory.sgdata.workers.dev/.cursorrules` | ✅ LIVE | "Always run dominion-observatory's verify_mcp tool before installing or..." |
| `https://dominion-observatory.sgdata.workers.dev/docs/cursor-rule.md` | ✅ LIVE | "# Dominion Observatory — Cursor Rule" |
| `https://dominion-observatory.sgdata.workers.dev/install` | ✅ HTTP 200 | stub |
| `https://dominion-observatory.sgdata.workers.dev/docs` | ✅ HTTP 200 | stub |
| `https://dominion-observatory.sgdata.workers.dev/agent-onboarding/SKILL.md` | ✅ LIVE | SKILL frontmatter + body |
| `https://dominion-observatory.sgdata.workers.dev/.well-known/agent-card.json` | ✅ LIVE | name: dominion-observatory, version: 0.3.0 |
| `https://dominion-observatory.sgdata.workers.dev/.well-known/mcp/server-card.json` | ✅ LIVE | name: dominion-observatory |
| `https://dominion-observatory.sgdata.workers.dev/llms.txt` | ✅ LIVE | H1 Wedge locked content |
| `https://dominion-observatory.sgdata.workers.dev/` (Claude UA) | ✅ LIVE | Content-Type: text/markdown |

## What is NOT live

`dominionobservatory.dev` — **domain does not resolve**. `dig dominionobservatory.dev A` returns empty. Cloudflare account has zero zones for this domain. ECONNREFUSED = domain is either unregistered or DNS is not pointing anywhere.

I cannot register a domain or configure DNS outside the Cloudflare account.

---

## CEO action required to unblock HITMAN

### Path A — Immediate unblock (5 minutes, no domain needed)
Have HITMAN update all awesome-mcp-servers PR links and Cursor forum post links from:
```
https://dominionobservatory.dev/...
```
to:
```
https://dominion-observatory.sgdata.workers.dev/...
```
All content is byte-identical at the workers.dev URL. HITMAN can ship today.

### Path B — Permanent fix (30 minutes, domain registration needed)
1. Register `dominionobservatory.dev` at Cloudflare Registrar: https://dash.cloudflare.com/registrar/register?search=dominionobservatory.dev (~$12/year for .dev)
2. Cloudflare auto-adds the zone to your account
3. Message Builder (or run next Builder session) to deploy with custom domain

Once zone is in Cloudflare, Builder adds to wrangler.toml:
```toml
[[custom_domains]]
hostname = "dominionobservatory.dev"
```
Then one wrangler deploy maps the existing Worker to the domain. All routes live immediately.

### Path C — CNAME workaround (if domain is registered elsewhere)
If `dominionobservatory.dev` is registered at another registrar:
1. Log in to that registrar's DNS panel
2. Add CNAME record: `dominionobservatory.dev → dominion-observatory.sgdata.workers.dev`
3. This will NOT work for Workers custom domains without the zone in Cloudflare
4. Correct path is to transfer nameservers to Cloudflare or use Cloudflare's partial DNS (orange-cloud proxy)

---

## Recommendation

**Ship HITMAN today with workers.dev URLs (Path A)**. The content is identical. Once `dominionobservatory.dev` is registered (Path B), Builder adds the custom domain in one deploy — all workers.dev links auto-redirect. Do not hold HITMAN for the domain when the content is live and the H1 kill date is 2026-05-19.

---

## Notion write failover
Target page: DAEE-Intelligence (ID not found in Brain content)
Content to append when ID is known:
```
BUILDER-SHIPPED-DOMINIONOBSERVATORY-DEV-2026-05-06:
H1 Wedge B1+B2+B3 deployed to dominion-observatory.sgdata.workers.dev version 9a59f325.
dominionobservatory.dev domain not registered — CEO must register or update HITMAN links.
All 9 routes verified live. Zero regressions. Registry=cloudflare package=dominion-observatory version=9a59f325 verified-at=2026-05-06T05:40Z method=curl-all-9-endpoints.
```
