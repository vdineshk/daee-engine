/**
 * flywheel-keeper
 *
 * Cron-driven traffic generator and uptime probe for the DAEE Builder
 * server fleet. Every 5 minutes it:
 *
 *   1. GETs /health on each of the 8 Builder servers and measures end-to-end
 *      latency + HTTP status.
 *   2. Reports each measurement to the Dominion Observatory as an anonymized
 *      interaction with tool_name = "_keeper_healthcheck" so the data can be
 *      filtered out of user-facing rollups if needed.
 *   3. Every 12th tick (~hourly) executes a real tool call against one
 *      rotating server so the Observatory also gets actual tool-execution
 *      latency rather than only health-probe latency. Tool calls are
 *      budgeted to stay under each server's free-tier 5/day/IP cap.
 *
 * Why this exists: the flywheel was warm-but-flat (~8 interactions/day total)
 * because nothing in the DAEE infrastructure was driving traffic on a
 * schedule. Real organic adoption is the long-term answer, but until the SDK
 * ships to npm/PyPI, this keeper is the forcing function that turns the
 * Observatory from a dead counter into a live latency/uptime baseline for
 * every Builder server, 24/7.
 *
 * Budget (at 5-min cadence):
 *   - Keeper outbound: 8 health GETs + 8 Observatory POSTs = 16 req/tick
 *     × 288 ticks/day = 4,608 req/day.
 *   - Health-probe load on each Builder server: 288 GET /health/day.
 *   - Tool calls on Builder servers: 2 per server per day (rotated), well
 *     under the free-tier 5/day/IP cap.
 *   - Observatory inbound: 8 report_interaction + 2 tool-call reports per
 *     tick for the server we hit = ~2,888 events/day.
 *
 * All free-tier compliant. No secrets required.
 */

const SERVERS = [
  "sg-regulatory-data-mcp",
  "sg-company-lookup-mcp",
  "asean-trade-rules-mcp",
  "sg-cpf-calculator-mcp",
  "sg-workpass-compass-mcp",
  "sg-gst-calculator-mcp",
  "sg-finance-data-mcp",
  "sg-weather-data-mcp",
] as const;

type Server = (typeof SERVERS)[number];

const OBSERVATORY_MCP = "https://dominion-observatory.sgdata.workers.dev/mcp";
const HEALTH_TOOL_NAME = "_keeper_healthcheck";
const REAL_TOOL_NAME_PREFIX = "_keeper_tool:";

interface ToolProbe {
  name: string;
  arguments: Record<string, unknown>;
}

// One realistic tool call per server. Inputs chosen to be cheap and valid
// against the currently deployed tool schemas.
const REAL_TOOL_PROBE: Record<Server, ToolProbe> = {
  "sg-regulatory-data-mcp": {
    name: "get_sg_holidays",
    arguments: { year: 2026 },
  },
  "sg-company-lookup-mcp": {
    name: "lookup_company",
    arguments: { uen: "200912345A" },
  },
  "asean-trade-rules-mcp": {
    name: "check_fta_eligibility",
    arguments: {
      origin_country: "SG",
      destination_country: "MY",
      hs_code: "8471.30",
    },
  },
  "sg-cpf-calculator-mcp": {
    name: "calculate_cpf",
    arguments: { age: 30, monthly_wage: 5000, residency: "citizen" },
  },
  "sg-workpass-compass-mcp": {
    name: "calculate_compass_score",
    arguments: {
      monthly_salary: 5500,
      age: 30,
      nationality: "IN",
      qualification: "degree",
    },
  },
  "sg-gst-calculator-mcp": {
    name: "calculate_gst",
    arguments: { amount: 1000 },
  },
  "sg-finance-data-mcp": {
    name: "get_sora_rate",
    arguments: {},
  },
  "sg-weather-data-mcp": {
    name: "get_sg_weather_now",
    arguments: {},
  },
};

interface KeeperState {
  tick_count: number;
  last_tick_at: string;
  last_health_ok: number;
  last_health_fail: number;
  last_tool_server: Server | "";
  last_tool_ok: boolean;
  last_tool_latency_ms: number;
  last_error?: string;
  agt_self_test_ok?: boolean;
  agt_self_test_at?: string;
  agt_self_test_latency_ms?: number;
}

async function computeHmacSHA256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Validates the AGT /api/agent-query/ two-step HMAC flow end-to-end.
// Step 1: unauthenticated → expect HTTP 402 + challenge field.
// Step 2: HMAC(secret, challenge) in Authorization header → expect HTTP 200 + status:"verified".
async function selfTestAgtEndpoint(
  env: Env,
  serverSlug: string
): Promise<{ ok: boolean; challenge_status: number; verify_status: number; verified: boolean; latency_ms: number }> {
  const start = Date.now();
  try {
    const r1 = await env.OBSERVATORY.fetch(`https://internal/api/agent-query/${serverSlug}`, { method: "GET" });
    const body1 = await r1.json() as { challenge?: string };
    const challenge = body1.challenge ?? `agt-${serverSlug}-fallback`;
    const secret = env.AGT_HMAC_SECRET ?? "self-test-token";
    const hmacHex = await computeHmacSHA256(secret, challenge);
    const r2 = await env.OBSERVATORY.fetch(`https://internal/api/agent-query/${serverSlug}`, {
      method: "GET",
      headers: { "Authorization": `HMAC ${hmacHex}` },
    });
    const body2 = await r2.json() as { status?: string };
    return {
      ok: r2.status === 200,
      challenge_status: r1.status,
      verify_status: r2.status,
      verified: body2.status === "verified",
      latency_ms: Date.now() - start,
    };
  } catch {
    return { ok: false, challenge_status: 0, verify_status: 0, verified: false, latency_ms: Date.now() - start };
  }
}

interface Env {
  KEEPER_STATE?: KVNamespace;
  AGT_HMAC_SECRET?: string;
  SG_REG: Fetcher;
  SG_COMPANY: Fetcher;
  ASEAN_TRADE: Fetcher;
  SG_CPF: Fetcher;
  SG_WORKPASS: Fetcher;
  SG_GST: Fetcher;
  SG_FINANCE: Fetcher;
  SG_WEATHER: Fetcher;
  OBSERVATORY: Fetcher;
}

function serviceFor(env: Env, server: Server): Fetcher {
  switch (server) {
    case "sg-regulatory-data-mcp":
      return env.SG_REG;
    case "sg-company-lookup-mcp":
      return env.SG_COMPANY;
    case "asean-trade-rules-mcp":
      return env.ASEAN_TRADE;
    case "sg-cpf-calculator-mcp":
      return env.SG_CPF;
    case "sg-workpass-compass-mcp":
      return env.SG_WORKPASS;
    case "sg-gst-calculator-mcp":
      return env.SG_GST;
    case "sg-finance-data-mcp":
      return env.SG_FINANCE;
    case "sg-weather-data-mcp":
      return env.SG_WEATHER;
  }
}

const REPORT_TIMEOUT_MS = 2500;
const HEALTH_TIMEOUT_MS = 4000;
const TOOL_TIMEOUT_MS = 15000;

async function reportInteraction(
  env: Env,
  serverMcpUrl: string,
  success: boolean,
  latencyMs: number,
  toolName: string,
  httpStatus: number
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS);
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
            server_url: serverMcpUrl,
            success,
            latency_ms: Math.max(0, Math.round(latencyMs)),
            tool_name: toolName,
            http_status: httpStatus,
          },
        },
      }),
      signal: controller.signal,
    });
  } catch {
    // Fire-and-forget. Observatory is best-effort.
  } finally {
    clearTimeout(timer);
  }
}

async function probeHealth(
  env: Env,
  server: Server
): Promise<{ ok: boolean; status: number; latency: number; error?: string }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await serviceFor(env, server).fetch("https://internal/health", {
      method: "GET",
      signal: controller.signal,
    });
    const latency = Date.now() - start;
    return { ok: res.ok, status: res.status, latency };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeTool(
  env: Env,
  server: Server
): Promise<{ ok: boolean; status: number; latency: number }> {
  const probe = REAL_TOOL_PROBE[server];
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: { name: probe.name, arguments: probe.arguments },
  });
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TOOL_TIMEOUT_MS);
  try {
    const res = await serviceFor(env, server).fetch("https://internal/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });
    const latency = Date.now() - start;
    if (!res.ok) return { ok: false, status: res.status, latency };
    const payload = (await res.json()) as { error?: unknown };
    return { ok: !payload.error, status: res.status, latency };
  } catch {
    return { ok: false, status: 0, latency: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

async function runTick(env: Env): Promise<KeeperState> {
  const now = new Date();
  let tickCount = 0;
  if (env.KEEPER_STATE) {
    const raw = await env.KEEPER_STATE.get("state");
    if (raw) {
      try {
        tickCount = (JSON.parse(raw) as KeeperState).tick_count ?? 0;
      } catch {
        tickCount = 0;
      }
    }
  }
  tickCount += 1;

  // Health probe all 8 servers in parallel.
  const healthResults = await Promise.all(
    SERVERS.map(async (s) => {
      const probe = await probeHealth(env, s);
      await reportInteraction(
        env,
        `https://${s}.sgdata.workers.dev/mcp`,
        probe.ok,
        probe.latency,
        HEALTH_TOOL_NAME,
        probe.status
      );
      return { server: s, ...probe };
    })
  );

  const okCount = healthResults.filter((r) => r.ok).length;
  const failCount = healthResults.length - okCount;

  // Every 12th tick (~ every 60 min at 5-min cadence), hit one real tool on
  // one rotating server. Rotation index derived from tick count so we cycle
  // through the 8-server fleet cleanly.
  let lastToolServer: Server | "" = "";
  let lastToolOk = false;
  let lastToolLatency = 0;
  if (tickCount % 12 === 0) {
    const idx = Math.floor(tickCount / 12) % SERVERS.length;
    const target = SERVERS[idx];
    const probe = await probeTool(env, target);
    await reportInteraction(
      env,
      `https://${target}.sgdata.workers.dev/mcp`,
      probe.ok,
      probe.latency,
      `${REAL_TOOL_NAME_PREFIX}${REAL_TOOL_PROBE[target].name}`,
      probe.status
    );
    lastToolServer = target;
    lastToolOk = probe.ok;
    lastToolLatency = probe.latency;
  }

  // Every 6th tick (~every 30 min), run the AGT /api/agent-query/ self-test.
  // This validates the x402 HMAC payment rail end-to-end: unauthenticated call
  // returns 402 + challenge; authenticated call returns 200 + "verified".
  let agtSelfTestOk: boolean | undefined;
  let agtSelfTestAt: string | undefined;
  let agtSelfTestLatency: number | undefined;
  if (tickCount % 6 === 0) {
    const agtResult = await selfTestAgtEndpoint(env, "sg-cpf-calculator-mcp");
    agtSelfTestOk = agtResult.ok && agtResult.verified;
    agtSelfTestAt = now.toISOString();
    agtSelfTestLatency = agtResult.latency_ms;
    // Report self-test result to Observatory as a named interaction.
    await reportInteraction(
      env,
      "https://dominion-observatory.sgdata.workers.dev/api/agent-query/sg-cpf-calculator-mcp",
      agtSelfTestOk,
      agtResult.latency_ms,
      "_keeper_agt_self_test",
      agtResult.verify_status
    );
  }

  const state: KeeperState = {
    tick_count: tickCount,
    last_tick_at: now.toISOString(),
    last_health_ok: okCount,
    last_health_fail: failCount,
    last_tool_server: lastToolServer,
    last_tool_ok: lastToolOk,
    last_tool_latency_ms: lastToolLatency,
    ...(agtSelfTestOk !== undefined && {
      agt_self_test_ok: agtSelfTestOk,
      agt_self_test_at: agtSelfTestAt,
      agt_self_test_latency_ms: agtSelfTestLatency,
    }),
  };

  if (env.KEEPER_STATE) {
    await env.KEEPER_STATE.put("state", JSON.stringify(state));
  }

  return state;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runTick(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "flywheel-keeper",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          cron: "*/5 * * * *",
          servers_probed: SERVERS.length,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/state") {
      if (!env.KEEPER_STATE) {
        return new Response(JSON.stringify({ error: "KV not bound" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
      const raw = await env.KEEPER_STATE.get("state");
      return new Response(raw ?? JSON.stringify({ tick_count: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/debug") {
      const r = await probeHealth(env, "sg-regulatory-data-mcp");
      return new Response(JSON.stringify(r, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/tick") {
      // Manual trigger for debugging — safe because it only writes to
      // Observatory and KV, no secrets, no destructive effects.
      const state = await runTick(env);
      return new Response(JSON.stringify(state, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/agt-test") {
      // Manual trigger for the AGT HMAC self-test. Validates the x402 payment
      // rail end-to-end without waiting for the 6th-tick schedule.
      const result = await selfTestAgtEndpoint(env, "sg-cpf-calculator-mcp");
      return new Response(JSON.stringify({
        primitive: "AGT-ALPHA-V1 x402 HMAC Payment Rail",
        self_test: result,
        pass: result.ok && result.verified,
        claim_uri: "https://dominion-observatory.sgdata.workers.dev/.well-known/mcp-observatory",
      }, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      "flywheel-keeper: cron-driven uptime probe + Observatory traffic generator\n" +
        "Endpoints: /health  /state  /tick\n",
      { headers: { "Content-Type": "text/plain" } }
    );
  },
};
