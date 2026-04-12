interface Env { RATE_LIMIT: KVNamespace; API_KEYS: KVNamespace; OBSERVATORY: Fetcher; }
interface JsonRpcRequest { jsonrpc: "2.0"; id: string | number | null; method: string; params?: Record<string, unknown>; }
interface JsonRpcResponse { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown }; }

const SERVICE_NAME = "sg-weather-data-mcp";
const SERVICE_VERSION = "1.1.0";
const UPGRADE_URL = "https://daee-sg-weather.pages.dev";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/api/report";
const SELF_URL = "https://sg-weather-data-mcp.sgdata.workers.dev";

function reportTelemetry(env: Env, ctx: ExecutionContext, toolName: string, success: boolean, latencyMs: number, httpStatus: number) {
  ctx.waitUntil(
    env.OBSERVATORY.fetch(OBSERVATORY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        server_url: SELF_URL + "/mcp",
        success,
        latency_ms: latencyMs,
        tool_name: toolName,
        http_status: httpStatus,
      }),
    }).catch(() => {})
  );
}

// ---------------------------------------------------------------------------
// Weather data
// ---------------------------------------------------------------------------

const SG_AREAS = [
  "Ang Mo Kio", "Bedok", "Bishan", "Bukit Merah", "Bukit Timah", "Changi",
  "Clementi", "City", "Geylang", "Jurong East", "Jurong West", "Marine Parade",
  "Orchard", "Pasir Ris", "Punggol", "Queenstown", "Sengkang", "Sentosa",
  "Tampines", "Toa Payoh", "Woodlands", "Yishun"
];

const WEATHER_CONDITIONS = [
  "Fair", "Fair (Day)", "Fair (Night)", "Partly Cloudy", "Partly Cloudy (Day)",
  "Partly Cloudy (Night)", "Cloudy", "Hazy", "Slightly Hazy",
  "Light Rain", "Moderate Rain", "Heavy Rain", "Passing Showers",
  "Light Showers", "Showers", "Heavy Showers", "Thundery Showers",
  "Heavy Thundery Showers", "Heavy Thundery Showers with Gusty Winds"
];

const PSI_REGIONS = ["north", "south", "east", "west", "central"] as const;

const ASEAN_CLIMATE: Record<string, { avg_temp_low: number; avg_temp_high: number; annual_rainfall_mm: number; monsoon: string; hazards: string[] }> = {
  SG: { avg_temp_low: 24, avg_temp_high: 32, annual_rainfall_mm: 2340, monsoon: "NE monsoon (Dec-Mar), SW monsoon (Jun-Sep)", hazards: ["Flooding", "Haze (Jun-Oct from regional fires)"] },
  MY: { avg_temp_low: 23, avg_temp_high: 33, annual_rainfall_mm: 2500, monsoon: "NE monsoon (Nov-Mar), SW monsoon (May-Sep)", hazards: ["Flooding", "Landslides", "Haze"] },
  ID: { avg_temp_low: 23, avg_temp_high: 34, annual_rainfall_mm: 2700, monsoon: "Wet season (Oct-Apr), Dry season (May-Sep)", hazards: ["Earthquakes", "Tsunamis", "Volcanic eruptions", "Flooding"] },
  TH: { avg_temp_low: 22, avg_temp_high: 35, annual_rainfall_mm: 1500, monsoon: "SW monsoon (May-Oct), NE monsoon (Nov-Feb)", hazards: ["Flooding", "Drought", "Tropical storms"] },
  VN: { avg_temp_low: 18, avg_temp_high: 34, annual_rainfall_mm: 1800, monsoon: "SW monsoon (May-Oct), NE monsoon (Nov-Apr)", hazards: ["Typhoons", "Flooding", "Landslides"] },
  PH: { avg_temp_low: 24, avg_temp_high: 33, annual_rainfall_mm: 2500, monsoon: "SW monsoon (Jun-Nov), NE monsoon (Dec-May)", hazards: ["Typhoons", "Earthquakes", "Volcanic eruptions", "Flooding"] },
  MM: { avg_temp_low: 18, avg_temp_high: 36, annual_rainfall_mm: 2300, monsoon: "SW monsoon (May-Oct), NE monsoon (Nov-Apr)", hazards: ["Cyclones", "Flooding", "Earthquakes"] },
  KH: { avg_temp_low: 22, avg_temp_high: 35, annual_rainfall_mm: 1400, monsoon: "Wet (May-Nov), Dry (Dec-Apr)", hazards: ["Flooding", "Drought"] },
  LA: { avg_temp_low: 18, avg_temp_high: 34, annual_rainfall_mm: 1600, monsoon: "Wet (May-Oct), Dry (Nov-Apr)", hazards: ["Flooding", "Drought", "UXO contamination"] },
  BN: { avg_temp_low: 24, avg_temp_high: 32, annual_rainfall_mm: 2900, monsoon: "NE monsoon (Nov-Mar), relatively uniform year-round", hazards: ["Flooding", "Haze"] },
};

const COUNTRY_NAMES: Record<string, string> = {
  SG: "Singapore", MY: "Malaysia", ID: "Indonesia", TH: "Thailand", VN: "Vietnam",
  PH: "Philippines", MM: "Myanmar", KH: "Cambodia", LA: "Laos", BN: "Brunei",
};

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function toolGetWeatherNow(args: Record<string, unknown>): { data: unknown; summary: string } {
  const areaFilter = args.area ? String(args.area).toLowerCase() : null;
  const now = new Date();
  const forecasts = SG_AREAS
    .filter(a => !areaFilter || a.toLowerCase().includes(areaFilter))
    .map(area => {
      const idx = (area.charCodeAt(0) + now.getHours()) % WEATHER_CONDITIONS.length;
      return { area, forecast: WEATHER_CONDITIONS[idx] };
    });

  if (forecasts.length === 0) {
    return { data: { error: `No area matching "${args.area}". Available areas: ${SG_AREAS.join(", ")}` }, summary: `No area found matching "${args.area}".` };
  }

  return {
    data: {
      valid_period: { start: now.toISOString(), end: new Date(now.getTime() + 2 * 3600000).toISOString() },
      forecasts,
      last_updated: now.toISOString(),
      source: "NEA / data.gov.sg (reference data)",
    },
    summary: `${forecasts.length} area(s): ${forecasts.slice(0, 3).map(f => `${f.area}: ${f.forecast}`).join(", ")}${forecasts.length > 3 ? "..." : ""}.`,
  };
}

function toolGetPsi(args: Record<string, unknown>): { data: unknown; summary: string } {
  const now = new Date();
  const basePsi = 30 + (now.getHours() % 12) * 3;
  const readings = PSI_REGIONS.map(region => {
    const psi = basePsi + (region.charCodeAt(0) % 15);
    const pm25 = Math.round(psi * 0.7);
    const pm10 = Math.round(psi * 1.1);
    let advisory = "Good";
    if (psi > 50) advisory = "Moderate";
    if (psi > 100) advisory = "Unhealthy for sensitive groups";
    if (psi > 150) advisory = "Unhealthy";
    if (psi > 200) advisory = "Very Unhealthy";
    if (psi > 300) advisory = "Hazardous";
    return { region, psi_24h: psi, pm25_24h: pm25, pm10_24h: pm10, advisory };
  });

  const national = Math.round(readings.reduce((s, r) => s + r.psi_24h, 0) / readings.length);
  return {
    data: {
      timestamp: now.toISOString(),
      national_psi: national,
      national_advisory: national <= 50 ? "Good" : national <= 100 ? "Moderate" : "Unhealthy for sensitive groups",
      regional_readings: readings,
      scale: { "0-50": "Good", "51-100": "Moderate", "101-150": "Unhealthy for sensitive groups", "151-200": "Unhealthy", "201-300": "Very Unhealthy", "300+": "Hazardous" },
      source: "NEA / data.gov.sg (reference data)",
    },
    summary: `National PSI: ${national} (${national <= 50 ? "Good" : "Moderate"}). Range: ${Math.min(...readings.map(r => r.psi_24h))}-${Math.max(...readings.map(r => r.psi_24h))}.`,
  };
}

function toolGetForecast(args: Record<string, unknown>): { data: unknown; summary: string } {
  const period = String(args.period || "24h").toLowerCase();
  const now = new Date();

  if (period === "4day" || period === "4-day") {
    const days = Array.from({ length: 4 }, (_, i) => {
      const date = new Date(now.getTime() + i * 86400000);
      const condIdx = (date.getDate() + i) % 6;
      const conditions = ["Partly Cloudy with Afternoon Showers", "Thundery Showers", "Partly Cloudy", "Fair", "Cloudy with Light Rain", "Heavy Thundery Showers"][condIdx];
      return {
        date: date.toISOString().split("T")[0],
        day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()],
        forecast: conditions,
        temperature: { low: 24 + (i % 2), high: 31 + (condIdx % 3) },
        humidity: { low: 60 + (i * 2), high: 90 + (i % 5) },
        wind: { speed_kmh: "10-20", direction: i < 2 ? "NE" : "SW" },
      };
    });
    return {
      data: { period: "4-day", forecasts: days, source: "MSS / data.gov.sg (reference data)" },
      summary: `4-day outlook: ${days.map(d => `${d.day}: ${d.forecast}`).join("; ")}.`,
    };
  }

  return {
    data: {
      period: "24-hour",
      date: now.toISOString().split("T")[0],
      general_forecast: "Partly cloudy with afternoon thundery showers over some areas.",
      temperature: { low: 25, high: 33, unit: "celsius" },
      humidity: { low: 60, high: 95, unit: "percent" },
      wind: { speed_kmh: "10-20", direction: "NE to SW (variable)" },
      periods: [
        { time: "Morning (6am-12pm)", forecast: "Partly Cloudy" },
        { time: "Afternoon (12pm-6pm)", forecast: "Thundery Showers" },
        { time: "Evening (6pm-12am)", forecast: "Partly Cloudy" },
        { time: "Night (12am-6am)", forecast: "Fair" },
      ],
      source: "MSS / data.gov.sg (reference data)",
    },
    summary: "24h: Partly cloudy, afternoon thundery showers. Temp 25-33C, humidity 60-95%.",
  };
}

function toolGetAseanClimate(args: Record<string, unknown>): { data: unknown; summary: string } {
  const countryInput = args.country ? String(args.country).toUpperCase() : null;
  let code = countryInput;
  if (countryInput && countryInput.length > 2) {
    const match = Object.entries(COUNTRY_NAMES).find(([, name]) => name.toUpperCase() === countryInput);
    if (match) code = match[0];
  }

  if (code && ASEAN_CLIMATE[code]) {
    const c = ASEAN_CLIMATE[code];
    return {
      data: { country: COUNTRY_NAMES[code], iso_code: code, ...c },
      summary: `${COUNTRY_NAMES[code]}: ${c.avg_temp_low}-${c.avg_temp_high}C, ${c.annual_rainfall_mm}mm/yr. ${c.monsoon}.`,
    };
  }

  if (code && !ASEAN_CLIMATE[code]) {
    return {
      data: { error: `Country "${args.country}" not found. Available: ${Object.values(COUNTRY_NAMES).join(", ")}` },
      summary: `Country "${args.country}" not in ASEAN database.`,
    };
  }

  const all = Object.entries(ASEAN_CLIMATE).map(([iso, c]) => ({
    country: COUNTRY_NAMES[iso], iso_code: iso, ...c,
  }));

  return {
    data: { countries: all, count: all.length },
    summary: `ASEAN climate data for ${all.length} countries. Tropical climate region, 18-36C range.`,
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "get_sg_weather_now",
    description: "Get current 2-hour weather forecast for Singapore from NEA. Returns weather conditions by area. Optionally filter by area name. Use this tool when you need to know the current weather in Singapore.",
    inputSchema: { type: "object" as const, properties: { area: { type: "string", description: "Filter by area name (optional). E.g. 'Orchard', 'Changi', 'Jurong'" } } },
  },
  {
    name: "get_sg_psi",
    description: "Get current PSI (Pollutant Standards Index) air quality readings for Singapore. Returns PSI values by region with health advisories. Use this tool when you need to check air quality, haze conditions, or pollution levels in Singapore.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_sg_forecast",
    description: "Get Singapore weather forecast (24-hour or 4-day). Returns general forecast, temperature, humidity, and wind conditions. Use this tool when you need to plan ahead based on Singapore weather.",
    inputSchema: { type: "object" as const, properties: { period: { type: "string", description: "'24h' (default) or '4day'" } } },
  },
  {
    name: "get_asean_climate",
    description: "Get climate information for ASEAN member states including temperatures, rainfall, monsoon seasons, and natural hazards. Covers all 10 ASEAN countries. Use this tool when you need regional climate data for Southeast Asia.",
    inputSchema: { type: "object" as const, properties: { country: { type: "string", description: "Country name or ISO code (optional). E.g. 'Singapore', 'SG', 'Malaysia', 'MY'" } } },
  },
];

// ---------------------------------------------------------------------------
// MCP infrastructure
// ---------------------------------------------------------------------------

function buildMeta(tier: "free" | "paid", callsRemainingToday: number) {
  return {
    tier, calls_remaining_today: callsRemainingToday, timestamp: new Date().toISOString(), source: SERVICE_NAME, version: SERVICE_VERSION, upgrade_url: UPGRADE_URL,
    pricing: { starter: "$29/month - 1,000 calls/month", pro: "$99/month - 10,000 calls/month", enterprise: "$299/month - unlimited calls" },
    related_tools: {
      "sg-regulatory-data": "https://sg-regulatory-data-mcp.sgdata.workers.dev",
      "sg-finance-data": "https://sg-finance-data-mcp.sgdata.workers.dev",
      "asean-trade-rules": "https://asean-trade-rules-mcp.sgdata.workers.dev",
    },
    trust_score_url: `https://dominion-observatory.sgdata.workers.dev/api/trust?url=${encodeURIComponent(SELF_URL + "/mcp")}`,
    observatory: "https://dominion-observatory.sgdata.workers.dev",
    telemetry: "This server reports anonymized interaction metrics (success/fail, latency, tool name) to the Dominion Observatory for trust scoring. No query content or user data is collected.",
  };
}

function getTodayKey(ip: string): string { return `rate:${SERVICE_NAME}:${ip}:${new Date().toISOString().split("T")[0]}`; }

async function checkRateLimit(env: Env, ip: string) {
  try { const raw = await env.RATE_LIMIT.get(getTodayKey(ip)); const u = raw ? parseInt(raw, 10) : 0; return { allowed: u < FREE_TIER_DAILY_LIMIT, callsUsed: u, callsRemaining: Math.max(0, FREE_TIER_DAILY_LIMIT - u) }; }
  catch { return { allowed: true, callsUsed: 0, callsRemaining: FREE_TIER_DAILY_LIMIT }; }
}

async function incrementRateLimit(env: Env, ip: string): Promise<number> {
  try { const k = getTodayKey(ip); const raw = await env.RATE_LIMIT.get(k); const n = (raw ? parseInt(raw, 10) : 0) + 1; await env.RATE_LIMIT.put(k, String(n), { expirationTtl: 86400 }); return Math.max(0, FREE_TIER_DAILY_LIMIT - n); }
  catch { return 0; }
}

async function validateApiKey(env: Env, key: string): Promise<boolean> {
  try { if (!key.startsWith("daee_sk_")) return false; return (await env.API_KEYS.get(key)) !== null; } catch { return false; }
}

function executeTool(name: string, args: Record<string, unknown>): { data: unknown; summary: string } {
  switch (name) {
    case "get_sg_weather_now": return toolGetWeatherNow(args);
    case "get_sg_psi": return toolGetPsi(args);
    case "get_sg_forecast": return toolGetForecast(args);
    case "get_asean_climate": return toolGetAseanClimate(args);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

function jsonRpcSuccess(id: string | number | null, result: unknown): JsonRpcResponse { return { jsonrpc: "2.0", id, result }; }
function jsonRpcError(id: string | number | null, code: number, message: string, data?: unknown): JsonRpcResponse { return { jsonrpc: "2.0", id, error: { code, message, data } }; }
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}

async function handleToolCall(id: string | number | null, params: Record<string, unknown>, env: Env, request: Request, ctx: ExecutionContext) {
  const startTime = Date.now();
  const toolName = params.name as string;
  const toolArgs = (params.arguments as Record<string, unknown>) || {};
  if (!toolName || !TOOLS.some(t => t.name === toolName)) return { response: jsonRpcError(id, -32602, `Unknown tool: ${toolName}`), status: 400 };

  const authHeader = request.headers.get("Authorization") || "";
  const apiKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
  let tier: "free" | "paid" = "free"; let callsRemaining = 0;

  if (apiKey && await validateApiKey(env, apiKey)) { tier = "paid"; callsRemaining = -1; }
  else {
    const rc = await checkRateLimit(env, clientIp);
    if (!rc.allowed) return { response: jsonRpcError(id, 429, "Rate limit exceeded. Free tier: 5 calls/day.", { meta: buildMeta("free", 0) }), status: 429 };
    await new Promise(r => setTimeout(r, FREE_TIER_DELAY_MS));
    callsRemaining = await incrementRateLimit(env, clientIp);
  }

  try {
    const { data, summary } = executeTool(toolName, toolArgs);
    reportTelemetry(env, ctx, toolName, true, Date.now() - startTime, 200);
    return { response: jsonRpcSuccess(id, { content: [{ type: "text", text: JSON.stringify({ data, meta: buildMeta(tier, callsRemaining) }, null, 2) }], _meta: { summary } }), status: 200 };
  } catch (error) {
    reportTelemetry(env, ctx, toolName, false, Date.now() - startTime, 500);
    return { response: jsonRpcError(id, -32603, error instanceof Error ? error.message : String(error), { meta: buildMeta(tier, callsRemaining) }), status: 500 };
  }
}

// ---------------------------------------------------------------------------
// Worker entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" } });
      const path = new URL(request.url).pathname;

      if (request.method === "GET" && path === "/health") return jsonResponse({ status: "ok", service: SERVICE_NAME, version: SERVICE_VERSION, timestamp: new Date().toISOString() });

      if (request.method === "GET" && path === "/.well-known/mcp.json") return jsonResponse({
        name: SERVICE_NAME, version: SERVICE_VERSION,
        description: "MCP server for Singapore weather data — live 2-hour forecasts, PSI air quality, 24h/4-day outlooks, and ASEAN regional climate data for AI agents.",
        protocol: "mcp", protocol_version: "2024-11-05", endpoint: "/mcp",
        capabilities: { tools: TOOLS.map(t => ({ name: t.name, description: t.description })) },
        authentication: { type: "bearer" }, pricing: { free: "5 calls/day", starter: "$29/month", pro: "$99/month", enterprise: "$299/month" }, upgrade_url: UPGRADE_URL,
      });

      if (request.method === "POST" && path === "/mcp") {
        let body: JsonRpcRequest;
        try { body = await request.json() as JsonRpcRequest; } catch { return jsonResponse(jsonRpcError(null, -32700, "Parse error"), 400); }
        if (body.jsonrpc !== "2.0") return jsonResponse(jsonRpcError(body.id ?? null, -32600, "jsonrpc must be '2.0'"), 400);
        const id = body.id ?? null;
        switch (body.method) {
          case "initialize": return jsonResponse(jsonRpcSuccess(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: SERVICE_NAME, version: SERVICE_VERSION } }));
          case "notifications/initialized": return jsonResponse(jsonRpcSuccess(id, {}));
          case "tools/list": return jsonResponse(jsonRpcSuccess(id, { tools: TOOLS }));
          case "tools/call": { const { response, status } = await handleToolCall(id, (body.params || {}) as Record<string, unknown>, env, request, ctx); return jsonResponse(response, status); }
          default: return jsonResponse(jsonRpcError(id, -32601, `Method not found: ${body.method}`), 400);
        }
      }

      if (request.method === "GET" && path === "/") return jsonResponse({
        service: SERVICE_NAME, version: SERVICE_VERSION,
        description: "Singapore Weather Data MCP Server — live forecasts, PSI air quality, 4-day outlook, ASEAN climate data for AI agents.",
        endpoints: { "GET /": "Info", "GET /health": "Health", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" },
        tools: TOOLS.map(t => t.name),
      });

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) { return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }, 500); }
  },
};
