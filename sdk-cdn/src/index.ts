/**
 * sdk-cdn
 *
 * CDN for dominion-observatory-sdk. Serves compiled JS, TypeScript .d.ts,
 * Python source, and a human-readable install page. Every fetch of a
 * versioned asset also reports an anonymized "sdk fetch" event to the
 * Dominion Observatory with tool_name = "_sdk_install" so adoption itself
 * becomes flywheel telemetry.
 *
 * Why this exists: until npm + PyPI publish tokens are provisioned, this
 * is how anyone on the public internet can actually install the SDK. It
 * works today, owns the distribution pipe, and is free-tier compliant.
 *
 * Routes handled explicitly (with correct MIME + CORS + telemetry):
 *   GET /                         -> install page (index.html)
 *   GET /v1/observatory.mjs       -> ES module (JavaScript, MIME: text/javascript)
 *   GET /v1/observatory.d.ts      -> TypeScript declarations
 *   GET /v1/observatory.py        -> Python source
 *   GET /health                   -> JSON health check
 *
 * Everything else is passed to the static assets binding, which serves
 * the public/ directory.
 */

interface Env {
  ASSETS: Fetcher;
  OBSERVATORY: Fetcher;
}

const SELF_URL = "https://sdk-cdn.sgdata.workers.dev";

const ASSET_ROUTES: Record<string, { path: string; contentType: string }> = {
  "/v1/observatory.mjs": {
    path: "/v1/observatory.mjs",
    contentType: "text/javascript; charset=utf-8",
  },
  "/v1/observatory.d.ts": {
    path: "/v1/observatory.d.ts",
    contentType: "application/typescript; charset=utf-8",
  },
  "/v1/observatory.py": {
    path: "/v1/observatory.py",
    contentType: "text/x-python; charset=utf-8",
  },
};

async function reportInstall(
  env: Env,
  pathname: string,
  latencyMs: number,
  status: number
): Promise<void> {
  try {
    await env.OBSERVATORY.fetch("https://internal/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "report_interaction",
          arguments: {
            server_url: `${SELF_URL}${pathname}`,
            success: status >= 200 && status < 400,
            latency_ms: Math.max(0, Math.round(latencyMs)),
            tool_name: "_sdk_install",
            http_status: status,
          },
        },
      }),
    });
  } catch {
    /* fire-and-forget */
  }
}

function withHeaders(res: Response, contentType: string): Response {
  const headers = new Headers(res.headers);
  headers.set("Content-Type", contentType);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  // Long cache: SDK files are versioned by URL (/v1/...). Revalidation
  // happens on major version bumps.
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  headers.set("X-SDK", "dominion-observatory-sdk");
  headers.set("X-SDK-Version", "0.1.0");
  headers.set(
    "X-Observatory",
    "https://dominion-observatory.sgdata.workers.dev"
  );
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "sdk-cdn",
          version: "0.1.0",
          sdk: "dominion-observatory-sdk",
          endpoints: Object.keys(ASSET_ROUTES),
          timestamp: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Versioned SDK assets: serve with correct MIME + CORS + telemetry.
    const route = ASSET_ROUTES[url.pathname];
    if (route) {
      const start = Date.now();
      const assetRes = await env.ASSETS.fetch(
        new Request(`https://internal${route.path}`, request)
      );
      const wrapped = withHeaders(assetRes, route.contentType);
      ctx.waitUntil(
        reportInstall(env, url.pathname, Date.now() - start, assetRes.status)
      );
      return wrapped;
    }

    // Fall through to static assets (index.html, future files).
    return env.ASSETS.fetch(request);
  },
};
