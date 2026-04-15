# Follow-up — Observatory worker root needs HTML content negotiation

**Filed:** 2026-04-15 (during Run #005, after LinkedIn distribution prep)
**Severity:** paper cut, not bleeding wound
**Blocking:** no (workaround in place)
**Owner:** next Builder run that has the Observatory source available

## The problem

`https://dominion-observatory.sgdata.workers.dev/` returns a JSON API
manifest to every `GET /` regardless of `Accept` header. This is correct
behavior for an MCP API endpoint (clients need to discover tools and
endpoints) but it is a UX disaster for any human who pastes the URL into
a browser from a LinkedIn post, blog comment, or business card.

User saw this firsthand on 2026-04-15: opened the URL in a browser,
got a wall of unformatted JSON that began with `{ "name": "Dominion
Observatory", ...`. Asked "is it supposed to be like this?" The answer
is "yes for machines, no for humans."

## Why it wasn't fixed in Run #005

The Observatory worker source code is **not in the daee-engine repo**.
It was deployed to Cloudflare from a different workspace (possibly an
earlier session that no longer exists). Three recovery attempts during
Run #005:

1. `wrangler init --from-dash dominion-observatory` returned a Hello
   World scaffold, not the real source. Cloudflare's dashboard import
   only works for workers originally deployed from a multi-file project,
   which this one was not.
2. Direct Cloudflare API call:
   `GET /accounts/:id/workers/scripts/dominion-observatory/content`
   returned `{"errors":[{"code":10405,"message":"Method not allowed for
   this authentication scheme"}]}`. The current `CLOUDFLARE_API_TOKEN`
   does not have the script read permission.
3. Searched the entire daee-engine repo for `Dominion Observatory`
   references in TypeScript files. Only the SDK and CDN reference it,
   neither contains the actual worker logic.

Conclusion: cannot be fixed from inside this repo + this Cloudflare
token in this session. Would require either (a) finding the original
source on the user's machine or another workspace, or (b) a Cloudflare
API token with `Workers Scripts:Read` permission to pull the deployed
bundle, or (c) rewriting the Observatory worker from scratch (high
risk: D1 schema, KV bindings, route bindings, MCP tool definitions
all live in that worker).

## Workaround in place

LinkedIn distribution materials and the user's profile header now
point to `sdk-cdn.sgdata.workers.dev` (the polished install page that
is in this repo and was fixed during Run #005) instead of the raw
Observatory URL. The Observatory URL is reserved for API consumers
only. Documented in the corrected pinned-comment template the user
is using on the MCP & Agentic AI LinkedIn group post.

This is architecturally correct: APIs serve JSON, landing pages serve
HTML, never the same URL. The fix below is a polish item, not a
correctness issue.

## The fix (when source is available)

Add Accept-header content negotiation to the Observatory worker's root
handler. Approximately 20 lines:

```ts
if (url.pathname === "/") {
  const accept = request.headers.get("Accept") || "";
  if (accept.includes("text/html")) {
    return new Response(LANDING_HTML, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return new Response(JSON.stringify(API_MANIFEST, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
```

`LANDING_HTML` should be a single self-contained HTML page (no external
deps, inline CSS) covering:

- One-line pitch: "The behavioral trust layer for the AI agent economy"
- Live stats embedded from `/api/stats` (server-side fetch + render, or
  a tiny inline JS fetch)
- Three CTAs: "Install the SDK" → sdk-cdn.sgdata.workers.dev, "Read
  trust scores" → /api/leaderboard, "API docs" → /mcp
- Privacy contract footer (the six-field disclosure, PDPA + IMDA + EU
  AI Act mentions)
- Same dark-navy minimalist style as sdk-cdn/public/index.html for
  visual consistency across the product surface

## Definition of done

- Browser visit to `https://dominion-observatory.sgdata.workers.dev/`
  renders an HTML page, not raw JSON.
- `curl https://dominion-observatory.sgdata.workers.dev/` (no Accept
  header) still returns the JSON manifest, so MCP clients and probes
  are unbroken.
- `curl -H "Accept: text/html" https://...` returns the HTML page.
- `curl -H "Accept: application/json" https://...` returns the JSON
  manifest.
- `/api/*` endpoints are unchanged and still serve JSON.
- `/mcp` endpoint is unchanged and still speaks JSON-RPC.

## First step for next run

Ask the user where the Observatory worker source lives. Likely
locations to check, in order:

1. Another local directory on the same machine (try `find ~ -name
   "wrangler.toml" 2>/dev/null | xargs grep -l dominion-observatory`)
2. A separate GitHub repo under `vdineshk/`
3. A previous Claude Code workspace that may have been deleted
4. Reconstructed from scratch using the live API behavior as the spec
   (riskiest, last resort)

Once located, mount it into the daee-engine repo (or work in-place if
it has its own git history) and apply the content negotiation fix.
Estimated effort: ~30 minutes of actual code, the rest is finding the
source and verifying nothing regresses.
