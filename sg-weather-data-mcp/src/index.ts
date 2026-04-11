// ---------------------------------------------------------------------------
// sg-weather-data-mcp — Singapore Weather Data MCP Server
// ---------------------------------------------------------------------------

interface Env { RATE_LIMIT: KVNamespace; API_KEYS: KVNamespace; }
interface JsonRpcRequest { jsonrpc: "2.0"; id: string | number | null; method: string; params?: Record<string, unknown>; }
interface JsonRpcResponse { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown }; }

const SERVICE_NAME = "sg-weather-data-mcp";
const SERVICE_VERSION = "1.0.0";
const UPGRADE_URL = "https://daee-sg-weather.pages.dev";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;
const SELF_URL = "https://sg-weather-data-mcp.sgdata.workers.dev";
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";

const DATA_GOV_BASE = "https://api.data.gov.sg/v1/environment";

// ---------------------------------------------------------------------------
// ASEAN climate reference data
// ---------------------------------------------------------------------------

const ASEAN_CLIMATE: Record<string, { country: string; capital: string; climate_type: string; avg_temp_c: { min: number; max: number }; avg_humidity_pct: { min: number; max: number }; annual_rainfall_mm: number; wet_season: string; dry_season: string; monsoon_info: string; natural_hazards: string[] }> = {
  SG: { country: "Singapore", capital: "Singapore", climate_type: "Tropical rainforest (Af)", avg_temp_c: { min: 24, max: 31 }, avg_humidity_pct: { min: 70, max: 90 }, annual_rainfall_mm: 2340, wet_season: "Nov-Jan (NE Monsoon)", dry_season: "May-Sep (SW Monsoon, drier)", monsoon_info: "NE Monsoon (Dec-Mar): wetter; SW Monsoon (Jun-Sep): drier with Sumatra squalls; Inter-monsoon (Apr-May, Oct-Nov): thunderstorms", natural_hazards: ["Flooding", "Haze (transboundary)"] },
  MY: { country: "Malaysia", capital: "Kuala Lumpur", climate_type: "Tropical rainforest (Af)", avg_temp_c: { min: 23, max: 32 }, avg_humidity_pct: { min: 70, max: 90 }, annual_rainfall_mm: 2500, wet_season: "Oct-Mar (East Coast), Sep-Dec (West Coast)", dry_season: "Jun-Aug", monsoon_info: "NE Monsoon (Nov-Mar): heavy rain on east coast; SW Monsoon (May-Sep): drier on peninsula", natural_hazards: ["Flooding", "Landslides", "Haze"] },
  ID: { country: "Indonesia", capital: "Jakarta", climate_type: "Tropical (Af/Am/Aw)", avg_temp_c: { min: 23, max: 34 }, avg_humidity_pct: { min: 70, max: 90 }, annual_rainfall_mm: 1800, wet_season: "Oct-Mar", dry_season: "Apr-Sep", monsoon_info: "NW Monsoon (Dec-Mar): wet season; SE Monsoon (Jun-Sep): dry season", natural_hazards: ["Earthquakes", "Volcanic eruptions", "Flooding", "Tsunamis"] },
  TH: { country: "Thailand", capital: "Bangkok", climate_type: "Tropical savanna (Aw)", avg_temp_c: { min: 22, max: 35 }, avg_humidity_pct: { min: 60, max: 85 }, annual_rainfall_mm: 1500, wet_season: "May-Oct (SW Monsoon)", dry_season: "Nov-Feb (cool), Mar-May (hot)", monsoon_info: "SW Monsoon (May-Oct): heavy rainfall; NE Monsoon (Nov-Feb): cool and dry", natural_hazards: ["Flooding", "Drought"] },
  PH: { country: "Philippines", capital: "Manila", climate_type: "Tropical maritime (Am/Aw)", avg_temp_c: { min: 24, max: 34 }, avg_humidity_pct: { min: 65, max: 85 }, annual_rainfall_mm: 2000, wet_season: "Jun-Nov", dry_season: "Dec-May", monsoon_info: "SW Monsoon/Habagat (Jun-Nov): wet; NE Monsoon/Amihan (Dec-May): dry", natural_hazards: ["Typhoons (avg 20/year)", "Earthquakes", "Volcanic eruptions", "Flooding"] },
  VN: { country: "Vietnam", capital: "Hanoi", climate_type: "Tropical monsoon (Am) / Humid subtropical (Cwa)", avg_temp_c: { min: 18, max: 35 }, avg_humidity_pct: { min: 65, max: 90 }, annual_rainfall_mm: 1700, wet_season: "May-Nov (south), Jun-Sep (north)", dry_season: "Dec-Apr", monsoon_info: "SW Monsoon (May-Sep): heavy rain in south; NE Monsoon (Oct-Mar): cool, damp in north", natural_hazards: ["Typhoons", "Flooding", "Landslides"] },
  MM: { country: "Myanmar", capital: "Naypyidaw", climate_type: "Tropical monsoon (Am)", avg_temp_c: { min: 18, max: 36 }, avg_humidity_pct: { min: 55, max: 85 }, annual_rainfall_mm: 2300, wet_season: "May-Oct (SW Monsoon)", dry_season: "Nov-Feb (cool), Mar-Apr (hot)", monsoon_info: "SW Monsoon (May-Oct): heavy rain; NE Monsoon (Nov-Feb): dry and cool", natural_hazards: ["Cyclones", "Flooding", "Earthquakes"] },
  KH: { country: "Cambodia", capital: "Phnom Penh", climate_type: "Tropical monsoon (Am)", avg_temp_c: { min: 22, max: 35 }, avg_humidity_pct: { min: 60, max: 85 }, annual_rainfall_mm: 1400, wet_season: "May-Oct", dry_season: "Nov-Apr", monsoon_info: "SW Monsoon (May-Oct): wet season; NE Monsoon (Nov-Apr): dry season", natural_hazards: ["Flooding", "Drought"] },
  LA: { country: "Laos", capital: "Vientiane", climate_type: "Tropical monsoon (Am)", avg_temp_c: { min: 18, max: 34 }, avg_humidity_pct: { min: 55, max: 85 }, annual_rainfall_mm: 1600, wet_season: "May-Oct", dry_season: "Nov-Apr", monsoon_info: "SW Monsoon (May-Oct): heavy rainfall; NE Monsoon (Nov-Apr): dry, cooler", natural_hazards: ["Flooding", "Drought"] },
  BN: { country: "Brunei", capital: "Bandar Seri Begawan", climate_type: "Tropical rainforest (Af)", avg_temp_c: { min: 23, max: 32 }, avg_humidity_pct: { min: 75, max: 90 }, annual_rainfall_mm: 2900, wet_season: "Sep-Jan", dry_season: "Feb-Apr (drier)", monsoon_info: "NE Monsoon (Nov-Mar): wettest period; SW Monsoon (May-Sep): moderate rain", natural_hazards: ["Flooding", "Haze"] },
};

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

async function getWeatherNow(args: Record<string, unknown>) {
  const area = (args.area as string || "").toLowerCase();

  try {
    const res = await fetch(`${DATA_GOV_BASE}/2-hour-weather-forecast`);
    if (!res.ok) return { error: `data.gov.sg API returned ${res.status}`, summary: "Failed to fetch weather data from data.gov.sg." };

    const json = await res.json() as {
      items?: Array<{
        update_timestamp: string;
        timestamp: string;
        valid_period: { start: string; end: string };
        forecasts: Array<{ area: string; forecast: string }>;
      }>;
      area_metadata?: Array<{ name: string; label_location: { latitude: number; longitude: number } }>;
    };

    const item = json.items?.[0];
    if (!item) return { error: "No forecast data available", summary: "No current weather data from data.gov.sg." };

    let forecasts = item.forecasts || [];
    if (area) {
      const filtered = forecasts.filter(f => f.area.toLowerCase().includes(area));
      if (filtered.length > 0) forecasts = filtered;
    }

    return {
      update_timestamp: item.update_timestamp,
      valid_period: item.valid_period,
      forecasts: forecasts.map(f => ({ area: f.area, forecast: f.forecast })),
      total_areas: item.forecasts?.length || 0,
      filtered: area ? `Showing areas matching "${area}"` : "All areas",
      data_source: "data.gov.sg (National Environment Agency)",
      summary: area
        ? `Weather for areas matching "${area}": ${forecasts.map(f => `${f.area}: ${f.forecast}`).join("; ")}. Valid: ${item.valid_period.start} to ${item.valid_period.end}.`
        : `Current 2-hour forecast for ${forecasts.length} areas in Singapore. Valid: ${item.valid_period.start} to ${item.valid_period.end}.`,
    };
  } catch (err) {
    return { error: `Failed to fetch weather: ${err instanceof Error ? err.message : String(err)}`, summary: "Error fetching live weather data." };
  }
}

async function getPsi(args: Record<string, unknown>) {
  const region = (args.region as string || "").toLowerCase();

  try {
    const res = await fetch(`${DATA_GOV_BASE}/psi`);
    if (!res.ok) return { error: `data.gov.sg API returned ${res.status}`, summary: "Failed to fetch PSI data from data.gov.sg." };

    const json = await res.json() as {
      items?: Array<{
        update_timestamp: string;
        timestamp: string;
        readings: Record<string, Record<string, number>>;
      }>;
      region_metadata?: Array<{ name: string; label_location: { latitude: number; longitude: number } }>;
    };

    const item = json.items?.[0];
    if (!item) return { error: "No PSI data available", summary: "No current PSI data from data.gov.sg." };

    const readings = item.readings || {};
    const regions = ["national", "north", "south", "east", "west", "central"];
    const targetRegions = region ? regions.filter(r => r.includes(region)) : regions;

    const psiData: Record<string, Record<string, number>> = {};
    for (const r of targetRegions) {
      psiData[r] = {};
      for (const [metric, values] of Object.entries(readings)) {
        if (values[r] !== undefined) psiData[r][metric] = values[r];
      }
    }

    const nationalPsi24h = readings.psi_twenty_four_hourly?.national;
    let healthAdvisory = "Normal";
    if (nationalPsi24h !== undefined) {
      if (nationalPsi24h <= 50) healthAdvisory = "Good - No precautions needed";
      else if (nationalPsi24h <= 100) healthAdvisory = "Moderate - Healthy individuals can continue normal activities";
      else if (nationalPsi24h <= 200) healthAdvisory = "Unhealthy - Reduce prolonged outdoor exertion";
      else if (nationalPsi24h <= 300) healthAdvisory = "Very Unhealthy - Avoid prolonged outdoor exertion";
      else healthAdvisory = "Hazardous - Avoid all outdoor activities";
    }

    return {
      update_timestamp: item.update_timestamp,
      readings: psiData,
      health_advisory: healthAdvisory,
      national_psi_24h: nationalPsi24h ?? null,
      psi_scale: { "0-50": "Good", "51-100": "Moderate", "101-200": "Unhealthy", "201-300": "Very Unhealthy", "301+": "Hazardous" },
      data_source: "data.gov.sg (National Environment Agency)",
      summary: `PSI readings as of ${item.update_timestamp}. National 24h PSI: ${nationalPsi24h ?? "N/A"}. Advisory: ${healthAdvisory}.`,
    };
  } catch (err) {
    return { error: `Failed to fetch PSI: ${err instanceof Error ? err.message : String(err)}`, summary: "Error fetching live PSI data." };
  }
}

async function getForecast(args: Record<string, unknown>) {
  const forecastType = (args.forecast_type as string || "24h").toLowerCase();

  try {
    const endpoint = forecastType === "4day"
      ? `${DATA_GOV_BASE}/4-day-weather-forecast`
      : `${DATA_GOV_BASE}/24-hour-weather-forecast`;

    const res = await fetch(endpoint);
    if (!res.ok) return { error: `data.gov.sg API returned ${res.status}`, summary: `Failed to fetch ${forecastType} forecast.` };

    const json = await res.json() as {
      items?: Array<{
        update_timestamp: string;
        timestamp: string;
        general?: {
          forecast: string;
          relative_humidity: { low: number; high: number };
          temperature: { low: number; high: number };
          wind: { speed: { low: number; high: number }; direction: string };
        };
        periods?: Array<{
          time: { start: string; end: string };
          regions: Record<string, string>;
        }>;
        forecasts?: Array<{
          date: string;
          forecast: string;
          relative_humidity: { low: number; high: number };
          temperature: { low: number; high: number };
          wind: { speed: { low: number; high: number }; direction: string };
        }>;
      }>;
    };

    const item = json.items?.[0];
    if (!item) return { error: "No forecast data available", summary: `No ${forecastType} forecast data.` };

    if (forecastType === "4day") {
      const forecasts = item.forecasts || [];
      return {
        update_timestamp: item.update_timestamp,
        forecast_type: "4-day",
        forecasts: forecasts.map(f => ({
          date: f.date,
          forecast: f.forecast,
          temperature: f.temperature,
          relative_humidity: f.relative_humidity,
          wind: f.wind,
        })),
        data_source: "data.gov.sg (Meteorological Service Singapore)",
        summary: `4-day forecast: ${forecasts.map(f => `${f.date}: ${f.forecast} (${f.temperature.low}-${f.temperature.high}${"\u00B0C"})`).join("; ")}.`,
      };
    }

    const general = item.general;
    const periods = item.periods || [];
    return {
      update_timestamp: item.update_timestamp,
      forecast_type: "24-hour",
      general: general ? {
        forecast: general.forecast,
        temperature: general.temperature,
        relative_humidity: general.relative_humidity,
        wind: general.wind,
      } : null,
      periods: periods.map(p => ({
        time: p.time,
        regions: p.regions,
      })),
      data_source: "data.gov.sg (Meteorological Service Singapore)",
      summary: general
        ? `24h forecast: ${general.forecast}. Temp: ${general.temperature.low}-${general.temperature.high}\u00B0C. Humidity: ${general.relative_humidity.low}-${general.relative_humidity.high}%.`
        : `24h forecast available with ${periods.length} time periods.`,
    };
  } catch (err) {
    return { error: `Failed to fetch forecast: ${err instanceof Error ? err.message : String(err)}`, summary: "Error fetching forecast data." };
  }
}

function getAseanClimate(args: Record<string, unknown>) {
  const countryCode = (args.country_code as string || "").toUpperCase();

  if (countryCode) {
    const data = ASEAN_CLIMATE[countryCode];
    if (!data) return {
      error: `Unknown country code: ${countryCode}. Valid codes: ${Object.keys(ASEAN_CLIMATE).join(", ")}`,
      summary: `Invalid country code "${countryCode}".`,
    };
    return {
      ...data,
      country_code: countryCode,
      data_source: "Meteorological reference data (ASEAN regional climate profiles)",
      summary: `${data.country} (${data.capital}): ${data.climate_type}. Temp: ${data.avg_temp_c.min}-${data.avg_temp_c.max}\u00B0C. Rainfall: ${data.annual_rainfall_mm}mm/year. Wet: ${data.wet_season}. Hazards: ${data.natural_hazards.join(", ")}.`,
    };
  }

  const overview = Object.entries(ASEAN_CLIMATE).map(([code, d]) => ({
    code,
    country: d.country,
    climate_type: d.climate_type,
    avg_temp_range: `${d.avg_temp_c.min}-${d.avg_temp_c.max}\u00B0C`,
    annual_rainfall_mm: d.annual_rainfall_mm,
  }));

  return {
    asean_member_states: overview,
    total_countries: overview.length,
    region_characteristics: "Equatorial and tropical climate zone. Dominated by monsoon systems (NE and SW). High humidity year-round. Significant rainfall variability across the region.",
    data_source: "Meteorological reference data (ASEAN regional climate profiles)",
    summary: `ASEAN climate overview for ${overview.length} member states. Temperature ranges from 18\u00B0C (northern regions) to 36\u00B0C. Annual rainfall: 1,400-2,900mm across the region.`,
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

interface ToolDefinition { name: string; description: string; inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] }; }

const TOOLS: ToolDefinition[] = [
  {
    name: "get_sg_weather_now",
    description: "Get current 2-hour weather forecast for Singapore from NEA (National Environment Agency) via data.gov.sg. Returns real-time weather conditions by area. Optionally filter by area name. Use this tool when you need to know the current weather in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        area: { type: "string", description: "Filter by area name (e.g. 'Ang Mo Kio', 'Orchard', 'Changi'). Case-insensitive partial match. Omit for all areas." },
      },
    },
  },
  {
    name: "get_sg_psi",
    description: "Get current PSI (Pollutant Standards Index) air quality readings for Singapore from NEA. Returns PSI values by region with health advisories. Use this tool when you need to check air quality, haze conditions, or pollution levels in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string", description: "Filter by region: 'national', 'north', 'south', 'east', 'west', 'central'. Omit for all regions." },
      },
    },
  },
  {
    name: "get_sg_forecast",
    description: "Get Singapore weather forecast (24-hour or 4-day) from Meteorological Service Singapore via data.gov.sg. Returns general forecast, temperature, humidity, and wind conditions. Use this tool when you need to plan ahead based on Singapore weather.",
    inputSchema: {
      type: "object",
      properties: {
        forecast_type: { type: "string", description: "'24h' for 24-hour forecast (default), '4day' for 4-day outlook." },
      },
    },
  },
  {
    name: "get_asean_climate",
    description: "Get climate information for ASEAN member states including average temperatures, rainfall, monsoon seasons, and natural hazards. Covers all 10 ASEAN countries. Use this tool when you need regional climate data for Southeast Asia for travel, business, or research purposes.",
    inputSchema: {
      type: "object",
      properties: {
        country_code: { type: "string", description: "ISO 3166-1 alpha-2 code: SG, MY, ID, TH, PH, VN, MM, KH, LA, BN. Omit for all countries overview." },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Observatory telemetry (anonymized, fire-and-forget)
// ---------------------------------------------------------------------------

function reportTelemetry(ctx: ExecutionContext, toolName: string, success: boolean, latencyMs: number, httpStatus: number) {
  ctx.waitUntil(
    fetch(OBSERVATORY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: Date.now(), method: 'tools/call',
        params: { name: 'report_interaction', arguments: { server_url: SELF_URL + '/mcp', success, latency_ms: latencyMs, tool_name: toolName, http_status: httpStatus } }
      })
    }).catch(() => {})
  );
}

// ---------------------------------------------------------------------------
// Shared MCP infrastructure
// ---------------------------------------------------------------------------

function buildMeta(tier: "free" | "paid", callsRemainingToday: number) {
  return {
    tier, calls_remaining_today: callsRemainingToday,
    timestamp: new Date().toISOString(), source: SERVICE_NAME, version: SERVICE_VERSION, upgrade_url: UPGRADE_URL,
    pricing: { starter: "$29/month - 1,000 calls/month", pro: "$99/month - 10,000 calls/month", enterprise: "$299/month - unlimited calls" },
    related_tools: {
      "sg-regulatory-data": "https://sg-regulatory-data-mcp.sgdata.workers.dev",
      "sg-cpf-calculator": "https://sg-cpf-calculator-mcp.sgdata.workers.dev",
      "sg-finance-data": "https://sg-finance-data-mcp.sgdata.workers.dev",
      "sg-gst-calculator": "https://sg-gst-calculator-mcp.sgdata.workers.dev",
    },
    trust_score_url: `https://dominion-observatory.sgdata.workers.dev/api/trust?url=${encodeURIComponent(SELF_URL)}`,
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

function jsonRpcSuccess(id: string | number | null, result: unknown): JsonRpcResponse { return { jsonrpc: "2.0", id, result }; }
function jsonRpcError(id: string | number | null, code: number, message: string, data?: unknown): JsonRpcResponse { return { jsonrpc: "2.0", id, error: { code, message, data } }; }
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<{ data: unknown; summary: string }> {
  switch (name) {
    case "get_sg_weather_now": { const r = await getWeatherNow(args); return { data: r, summary: (r as Record<string, unknown>).summary as string }; }
    case "get_sg_psi": { const r = await getPsi(args); return { data: r, summary: (r as Record<string, unknown>).summary as string }; }
    case "get_sg_forecast": { const r = await getForecast(args); return { data: r, summary: (r as Record<string, unknown>).summary as string }; }
    case "get_asean_climate": { const r = getAseanClimate(args); return { data: r, summary: (r as Record<string, unknown>).summary as string }; }
    default: throw new Error(`Unknown tool: ${name}`);
  }
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
    if (!rc.allowed) { reportTelemetry(ctx, toolName, false, Date.now() - startTime, 429); return { response: jsonRpcError(id, 429, "Rate limit exceeded. Free tier: 5 calls/day.", { meta: buildMeta("free", 0) }), status: 429 }; }
    await new Promise(r => setTimeout(r, FREE_TIER_DELAY_MS));
    callsRemaining = await incrementRateLimit(env, clientIp);
  }

  try {
    const { data, summary } = await executeTool(toolName, toolArgs);
    reportTelemetry(ctx, toolName, true, Date.now() - startTime, 200);
    return { response: jsonRpcSuccess(id, { content: [{ type: "text", text: JSON.stringify({ data, meta: buildMeta(tier, callsRemaining) }, null, 2) }], _meta: { summary } }), status: 200 };
  } catch (error) {
    reportTelemetry(ctx, toolName, false, Date.now() - startTime, 500);
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
        authentication: { type: "bearer", description: "Bearer token for paid tier. Free tier: 5 calls/day with 3s delay." },
        pricing: { free: "5 calls/day, 3s delay", starter: "$29/month", pro: "$99/month", enterprise: "$299/month" },
        upgrade_url: UPGRADE_URL,
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
        description: "Singapore Weather Data MCP Server — live weather, PSI air quality, forecasts, and ASEAN climate data for AI agents.",
        endpoints: { "GET /": "Info", "GET /health": "Health", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" },
        tools: TOOLS.map(t => t.name),
      });

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) { return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }, 500); }
  },
};
