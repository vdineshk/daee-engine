// ---------------------------------------------------------------------------
// sg-weather-data-mcp — Singapore Weather & ASEAN Climate MCP Server
// Live data from data.gov.sg APIs + ASEAN regional climate data
// ---------------------------------------------------------------------------

interface Env { RATE_LIMIT: KVNamespace; API_KEYS: KVNamespace; }
interface JsonRpcRequest { jsonrpc: "2.0"; id: string | number | null; method: string; params?: Record<string, unknown>; }
interface JsonRpcResponse { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown }; }

const SERVICE_NAME = "sg-weather-data-mcp";
const SERVICE_VERSION = "1.0.0";
const UPGRADE_URL = "https://daee-sg-weather.pages.dev";
const SELF_URL = "https://sg-weather-data-mcp.sgdata.workers.dev";
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;
const DATA_GOV_SG = "https://api.data.gov.sg/v1/environment";

// ---------------------------------------------------------------------------
// ASEAN Climate Reference Data
// ---------------------------------------------------------------------------

const ASEAN_CLIMATE: Record<string, {
  country: string;
  capital: string;
  climate_type: string;
  avg_temp_celsius: number;
  avg_annual_rainfall_mm: number;
  dry_season: string | null;
  rainy_season: string;
  best_months_travel: string;
  typhoon_risk: boolean;
  monsoon: string;
  notes: string;
}> = {
  SG: {
    country: "Singapore",
    capital: "Singapore",
    climate_type: "Equatorial",
    avg_temp_celsius: 27.5,
    avg_annual_rainfall_mm: 2360,
    dry_season: null,
    rainy_season: "Nov–Jan (Northeast Monsoon), Jun–Jul (Southwest Monsoon)",
    best_months_travel: "Feb–Apr",
    typhoon_risk: false,
    monsoon: "Northeast (Nov-Mar), Southwest (Jun-Sep)",
    notes: "Uniform hot and humid year-round. Heavy afternoon thunderstorms common. No defined dry season.",
  },
  MY: {
    country: "Malaysia",
    capital: "Kuala Lumpur",
    climate_type: "Equatorial",
    avg_temp_celsius: 27.0,
    avg_annual_rainfall_mm: 2600,
    dry_season: "Jun–Aug (West Coast)",
    rainy_season: "Oct–Feb (East Coast), Apr–May (West Coast)",
    best_months_travel: "Feb–Apr, Jul–Aug (West Coast)",
    typhoon_risk: false,
    monsoon: "Northeast (Nov-Mar), Southwest (May-Sep)",
    notes: "East and West Coast have different monsoon patterns. East Coast flooding risk Nov-Jan.",
  },
  TH: {
    country: "Thailand",
    capital: "Bangkok",
    climate_type: "Tropical Monsoon",
    avg_temp_celsius: 29.0,
    avg_annual_rainfall_mm: 1500,
    dry_season: "Nov–Apr",
    rainy_season: "May–Oct",
    best_months_travel: "Nov–Feb",
    typhoon_risk: true,
    monsoon: "Southwest (May-Oct)",
    notes: "Bangkok flooding risk Jul-Oct. Northern Thailand cooler Dec-Feb. Phuket: Oct-Apr dry season.",
  },
  ID: {
    country: "Indonesia",
    capital: "Jakarta",
    climate_type: "Tropical Monsoon",
    avg_temp_celsius: 28.0,
    avg_annual_rainfall_mm: 1800,
    dry_season: "Jun–Sep",
    rainy_season: "Oct–May",
    best_months_travel: "Jul–Sep",
    typhoon_risk: false,
    monsoon: "Northwest (Oct-Mar wet), Southeast (May-Sep dry)",
    notes: "Java and Bali: dry season Jun-Sep. Sumatra: year-round rain. Flood risk Jakarta Nov-Feb.",
  },
  PH: {
    country: "Philippines",
    capital: "Manila",
    climate_type: "Tropical Maritime",
    avg_temp_celsius: 27.5,
    avg_annual_rainfall_mm: 2000,
    dry_season: "Dec–May",
    rainy_season: "Jun–Nov",
    best_months_travel: "Jan–Apr",
    typhoon_risk: true,
    monsoon: "Southwest (Jun-Sep), Northeast (Oct-Mar)",
    notes: "High typhoon risk Jun-Nov (especially Jul-Oct). Visayas: Dec-May best. Manila flooding risk rainy season.",
  },
  VN: {
    country: "Vietnam",
    capital: "Hanoi",
    climate_type: "Tropical/Subtropical Monsoon",
    avg_temp_celsius: 25.0,
    avg_annual_rainfall_mm: 1820,
    dry_season: "Nov–Apr (South), Oct–Apr (Central)",
    rainy_season: "May–Oct (South), Sep–Jan (Central)",
    best_months_travel: "Nov–Apr (South), Mar–Aug (North)",
    typhoon_risk: true,
    monsoon: "Southwest (May-Oct South), Northeast (Oct-Apr North)",
    notes: "Three climate zones (North/Central/South). Hanoi: cool dry Nov-Apr. Ho Chi Minh: dry Nov-Apr.",
  },
  MM: {
    country: "Myanmar",
    capital: "Naypyidaw",
    climate_type: "Tropical Monsoon",
    avg_temp_celsius: 27.0,
    avg_annual_rainfall_mm: 2500,
    dry_season: "Nov–Apr",
    rainy_season: "May–Oct",
    best_months_travel: "Nov–Feb",
    typhoon_risk: true,
    monsoon: "Southwest (May-Oct)",
    notes: "Extreme heat Mar-May (up to 43°C). Cyclone risk Bay of Bengal May and Oct.",
  },
  KH: {
    country: "Cambodia",
    capital: "Phnom Penh",
    climate_type: "Tropical Monsoon",
    avg_temp_celsius: 28.5,
    avg_annual_rainfall_mm: 1400,
    dry_season: "Nov–Apr",
    rainy_season: "May–Oct",
    best_months_travel: "Nov–Feb",
    typhoon_risk: false,
    monsoon: "Southwest (May-Oct)",
    notes: "Angkor Wat best Nov-Feb. Flooding around Tonle Sap Sep-Oct. Hottest Mar-Apr.",
  },
  LA: {
    country: "Laos",
    capital: "Vientiane",
    climate_type: "Tropical Monsoon",
    avg_temp_celsius: 26.0,
    avg_annual_rainfall_mm: 1700,
    dry_season: "Nov–Apr",
    rainy_season: "May–Oct",
    best_months_travel: "Nov–Mar",
    typhoon_risk: false,
    monsoon: "Southwest (May-Oct)",
    notes: "Landlocked. Cool and dry Nov-Feb. Very hot Mar-May. Northern highlands much cooler in winter.",
  },
  BN: {
    country: "Brunei",
    capital: "Bandar Seri Begawan",
    climate_type: "Equatorial",
    avg_temp_celsius: 28.0,
    avg_annual_rainfall_mm: 3000,
    dry_season: null,
    rainy_season: "Oct–Feb",
    best_months_travel: "Mar–May",
    typhoon_risk: false,
    monsoon: "Northeast (Oct-Mar)",
    notes: "High humidity year-round. Heaviest rain Nov-Jan.",
  },
};

const SG_PSI_THRESHOLDS = {
  bands: [
    { range: "0-50", category: "Good", health_guidance: "Normal activities" },
    { range: "51-100", category: "Moderate", health_guidance: "Sensitive groups should reduce prolonged outdoor exertion" },
    { range: "101-200", category: "Unhealthy", health_guidance: "Everyone should reduce prolonged outdoor exertion" },
    { range: "201-300", category: "Very Unhealthy", health_guidance: "Everyone should avoid prolonged outdoor exertion; wear N95 mask" },
    { range: "301+", category: "Hazardous", health_guidance: "Everyone should remain indoors; wear N95 if outdoors is necessary" },
  ],
  note: "Singapore uses 3-hour PSI as primary measure. PM2.5 24-hr average also reported separately.",
  source: "NEA (nea.gov.sg)",
};

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "get_sg_weather_now",
    description: "Live 2-hour weather forecast for all areas of Singapore from NEA/data.gov.sg. Use this tool when you need current Singapore weather conditions by area for logistics, event planning, or safety decisions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        area: {
          type: "string",
          description: "Filter by area name (e.g., 'Jurong West', 'Orchard', 'Changi'). Leave empty for all 47 areas.",
        },
      },
    },
  },
  {
    name: "get_sg_psi",
    description: "Live Singapore PSI (Pollutant Standards Index) air quality readings from NEA/data.gov.sg. Use this tool when you need Singapore air quality data for health advisories, outdoor event decisions, or environmental compliance.",
    inputSchema: {
      type: "object" as const,
      properties: {
        region: {
          type: "string",
          description: "Filter by region: north, south, east, west, central. Leave empty for all regions.",
        },
      },
    },
  },
  {
    name: "get_sg_forecast",
    description: "Live 24-hour and 4-day weather forecast for Singapore from NEA/data.gov.sg. Use this tool when you need Singapore weather forecast for upcoming events, outdoor operations, or supply chain planning.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_asean_climate",
    description: "ASEAN regional climate data — monsoon seasons, dry/wet patterns, typhoon risk, and best travel months for all 10 ASEAN member states. Use this tool when you need regional weather context for ASEAN business travel, supply chain routing, or cross-border logistics planning.",
    inputSchema: {
      type: "object" as const,
      properties: {
        country_code: {
          type: "string",
          description: "ISO 2-letter country code: SG, MY, TH, ID, PH, VN, MM, KH, LA, BN. Leave empty for all ASEAN countries.",
        },
        current_month: {
          type: "number",
          description: "Month (1-12) to get travel/weather advice for. Optional — leave empty for full annual data.",
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Live data fetchers
// ---------------------------------------------------------------------------

async function fetchWeatherNow(area?: string): Promise<{ data: unknown; summary: string }> {
  const resp = await fetch(`${DATA_GOV_SG}/2-hour-weather-forecast`, {
    headers: { "User-Agent": "sg-weather-data-mcp/1.0 (DAEE Agent Economy)" },
  });

  if (!resp.ok) {
    throw new Error(`data.gov.sg API returned ${resp.status}. Endpoint: ${DATA_GOV_SG}/2-hour-weather-forecast`);
  }

  const json = await resp.json() as {
    area_metadata: { name: string; label_location: { latitude: number; longitude: number } }[];
    items: { timestamp: string; update_timestamp: string; forecasts: { area: string; forecast: string }[] }[];
  };

  const item = json.items?.[0];
  if (!item) throw new Error("No forecast data returned from data.gov.sg");

  let forecasts = item.forecasts;
  if (area) {
    const filter = area.toLowerCase();
    const filtered = forecasts.filter(f => f.area.toLowerCase().includes(filter));
    if (filtered.length === 0) {
      const allAreas = forecasts.map(f => f.area).join(", ");
      throw new Error(`Area '${area}' not found. Available areas: ${allAreas}`);
    }
    forecasts = filtered;
  }

  const conditionCounts: Record<string, number> = {};
  for (const f of forecasts) {
    conditionCounts[f.forecast] = (conditionCounts[f.forecast] || 0) + 1;
  }
  const dominant = Object.entries(conditionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

  return {
    data: {
      timestamp: item.timestamp,
      update_timestamp: item.update_timestamp,
      forecasts,
      area_count: forecasts.length,
      condition_summary: conditionCounts,
      source: "NEA / data.gov.sg",
      official_url: "https://www.nea.gov.sg/our-services/weather",
    },
    summary: `Singapore weather (${item.timestamp}): ${forecasts.length} areas. Dominant condition: ${dominant}. ${area ? `Filtered for: ${area}` : "All 47 areas shown."}`,
  };
}

async function fetchPsi(region?: string): Promise<{ data: unknown; summary: string }> {
  const resp = await fetch(`${DATA_GOV_SG}/psi`, {
    headers: { "User-Agent": "sg-weather-data-mcp/1.0 (DAEE Agent Economy)" },
  });

  if (!resp.ok) throw new Error(`data.gov.sg PSI API returned ${resp.status}`);

  const json = await resp.json() as {
    region_metadata: { name: string; label_location: { latitude: number; longitude: number } }[];
    items: { timestamp: string; update_timestamp: string; readings: Record<string, Record<string, number>>; }[];
  };

  const item = json.items?.[0];
  if (!item) throw new Error("No PSI data returned from data.gov.sg");

  const psi3hr = item.readings["psi_twenty_four_hourly"] || item.readings["psi_three_hourly"] || {};
  let regionData: Record<string, number>;

  if (region) {
    const r = region.toLowerCase();
    if (!psi3hr[r] && !psi3hr[`${r}_region`]) {
      throw new Error(`Region '${region}' not found. Available regions: ${Object.keys(psi3hr).join(", ")}`);
    }
    regionData = {};
    for (const [k, v] of Object.entries(psi3hr)) {
      if (k.toLowerCase().includes(r)) regionData[k] = v;
    }
  } else {
    regionData = psi3hr as Record<string, number>;
  }

  const values = Object.values(regionData).filter(v => typeof v === "number");
  const maxPsi = values.length > 0 ? Math.max(...values) : 0;
  const band = SG_PSI_THRESHOLDS.bands.find(b => {
    const [min, max] = b.range.includes("+") ? [parseInt(b.range), Infinity] : b.range.split("-").map(Number);
    return maxPsi >= min && maxPsi <= (max ?? Infinity);
  });

  return {
    data: {
      timestamp: item.timestamp,
      psi_readings: regionData,
      all_readings: item.readings,
      health_guidance: band || SG_PSI_THRESHOLDS.bands[0],
      thresholds: SG_PSI_THRESHOLDS.bands,
      source: "NEA / data.gov.sg",
      official_url: "https://www.haze.gov.sg/",
    },
    summary: `Singapore PSI (${item.timestamp}): Max ${maxPsi} — ${band?.category || "Good"}. ${band?.health_guidance || "Normal activities."}`,
  };
}

async function fetchForecast(): Promise<{ data: unknown; summary: string }> {
  const [resp24h] = await Promise.all([
    fetch(`${DATA_GOV_SG}/24-hour-weather-forecast`, {
      headers: { "User-Agent": "sg-weather-data-mcp/1.0 (DAEE Agent Economy)" },
    }),
  ]);

  if (!resp24h.ok) throw new Error(`data.gov.sg 24h forecast API returned ${resp24h.status}`);

  const json24h = await resp24h.json() as {
    items: {
      update_timestamp: string;
      timestamp: string;
      valid_period: { start: string; end: string };
      general: { forecast: string; relative_humidity: { low: number; high: number }; temperature: { low: number; high: number }; wind: { speed: { low: number; high: number }; direction: string } };
      periods: { time: { start: string; end: string }; regions: { west: string; east: string; central: string; south: string; north: string } }[];
    }[];
  };

  const item = json24h.items?.[0];
  if (!item) throw new Error("No 24h forecast data returned");

  return {
    data: {
      update_timestamp: item.update_timestamp,
      valid_period: item.valid_period,
      general_forecast: item.general,
      regional_periods: item.periods,
      source: "NEA / data.gov.sg",
      official_url: "https://www.nea.gov.sg/our-services/weather",
    },
    summary: `Singapore 24h forecast: ${item.general.forecast}. Temp ${item.general.temperature.low}–${item.general.temperature.high}°C. Humidity ${item.general.relative_humidity.low}–${item.general.relative_humidity.high}%.`,
  };
}

function toolGetAseanClimate(args: Record<string, unknown>): { data: unknown; summary: string } {
  const countryCode = (args.country_code as string || "").toUpperCase();
  const currentMonth = args.current_month as number | undefined;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (countryCode && ASEAN_CLIMATE[countryCode]) {
    const country = ASEAN_CLIMATE[countryCode];
    let monthAdvice: string | undefined;
    if (currentMonth && currentMonth >= 1 && currentMonth <= 12) {
      const monthName = monthNames[currentMonth - 1];
      const isDry = country.dry_season && country.dry_season.toLowerCase().includes(monthName.toLowerCase());
      const isRainy = country.rainy_season.toLowerCase().includes(monthName.toLowerCase());
      monthAdvice = isDry ? `${monthName}: Dry season — good for outdoor activities.` : isRainy ? `${monthName}: Rainy season — expect heavy rainfall.` : `${monthName}: Transitional period.`;
    }
    return {
      data: { ...country, month_advice: monthAdvice, country_code: countryCode },
      summary: `${country.country}: ${country.climate_type}, avg ${country.avg_temp_celsius}°C, ${country.avg_annual_rainfall_mm}mm/yr. Best months: ${country.best_months_travel}. Typhoon risk: ${country.typhoon_risk ? "YES" : "No"}.`,
    };
  } else if (!countryCode) {
    const allCountries: Record<string, unknown> = {};
    for (const [code, data] of Object.entries(ASEAN_CLIMATE)) {
      let monthAdvice: string | undefined;
      if (currentMonth && currentMonth >= 1 && currentMonth <= 12) {
        const monthName = monthNames[currentMonth - 1];
        const isDry = data.dry_season && data.dry_season.toLowerCase().includes(monthName.toLowerCase());
        const isRainy = data.rainy_season.toLowerCase().includes(monthName.toLowerCase());
        monthAdvice = isDry ? "Dry season" : isRainy ? "Rainy season" : "Transitional";
      }
      allCountries[code] = { country: data.country, climate_type: data.climate_type, avg_temp_celsius: data.avg_temp_celsius, best_months_travel: data.best_months_travel, typhoon_risk: data.typhoon_risk, month_advice: monthAdvice };
    }
    return {
      data: { asean_countries: allCountries, data_for_month: currentMonth ? monthNames[currentMonth - 1] : undefined },
      summary: `ASEAN climate overview: 10 countries. Typhoon risk: PH, VN, TH, MM. Best months vary by country.${currentMonth ? ` Month: ${monthNames[currentMonth - 1]}.` : ""}`,
    };
  } else {
    throw new Error(`Country code '${countryCode}' not found. Available ASEAN codes: ${Object.keys(ASEAN_CLIMATE).join(", ")}`);
  }
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<{ data: unknown; summary: string }> {
  switch (name) {
    case "get_sg_weather_now": return fetchWeatherNow(args.area as string | undefined);
    case "get_sg_psi": return fetchPsi(args.region as string | undefined);
    case "get_sg_forecast": return fetchForecast();
    case "get_asean_climate": return toolGetAseanClimate(args);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Meta builder
// ---------------------------------------------------------------------------

function buildMeta(tier: "free" | "paid", callsRemainingToday: number) {
  return {
    tier, calls_remaining_today: callsRemainingToday,
    timestamp: new Date().toISOString(), source: SERVICE_NAME, version: SERVICE_VERSION,
    upgrade_url: UPGRADE_URL,
    trust_score_url: `https://dominion-observatory.sgdata.workers.dev/api/trust?url=${encodeURIComponent(SELF_URL + "/mcp")}`,
    observatory: "https://dominion-observatory.sgdata.workers.dev",
    pricing: { starter: "$29/month - 1,000 calls/month", pro: "$99/month - 10,000 calls/month", enterprise: "$299/month - unlimited calls" },
    related_tools: {
      "sg-regulatory-data": "https://sg-regulatory-data-mcp.sgdata.workers.dev",
      "sg-finance-data": "https://sg-finance-data-mcp.sgdata.workers.dev",
      "asean-trade-rules": "https://asean-trade-rules-mcp.sgdata.workers.dev",
    },
  };
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

function getTodayKey(ip: string): string { return `rate:${SERVICE_NAME}:${ip}:${new Date().toISOString().split("T")[0]}`; }

async function checkRateLimit(env: Env, ip: string) {
  try { const raw = await env.RATE_LIMIT.get(getTodayKey(ip)); const u = raw ? parseInt(raw, 10) : 0; return { allowed: u < FREE_TIER_DAILY_LIMIT, callsRemaining: Math.max(0, FREE_TIER_DAILY_LIMIT - u) }; }
  catch { return { allowed: true, callsRemaining: FREE_TIER_DAILY_LIMIT }; }
}

async function incrementRateLimit(env: Env, ip: string): Promise<number> {
  try { const k = getTodayKey(ip); const raw = await env.RATE_LIMIT.get(k); const n = (raw ? parseInt(raw, 10) : 0) + 1; await env.RATE_LIMIT.put(k, String(n), { expirationTtl: 86400 }); return Math.max(0, FREE_TIER_DAILY_LIMIT - n); }
  catch { return 0; }
}

async function validateApiKey(env: Env, key: string): Promise<boolean> {
  try { if (!key.startsWith("daee_sk_")) return false; return (await env.API_KEYS.get(key)) !== null; } catch { return false; }
}

// ---------------------------------------------------------------------------
// JSON-RPC helpers
// ---------------------------------------------------------------------------

function jsonRpcSuccess(id: string | number | null, result: unknown) { return { jsonrpc: "2.0" as const, id, result }; }
function jsonRpcError(id: string | number | null, code: number, message: string, data?: unknown) { return { jsonrpc: "2.0" as const, id, error: { code, message, data } }; }
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}

// ---------------------------------------------------------------------------
// Tool call handler
// ---------------------------------------------------------------------------

async function handleToolCall(id: string | number | null, params: Record<string, unknown>, env: Env, request: Request, ctx: ExecutionContext) {
  const toolName = params.name as string;
  const toolArgs = (params.arguments as Record<string, unknown>) || {};
  if (!toolName || !TOOLS.some(t => t.name === toolName)) {
    return { response: jsonRpcError(id, -32602, `Unknown tool: ${toolName}. Available: ${TOOLS.map(t => t.name).join(", ")}`), status: 400 };
  }

  const authHeader = request.headers.get("Authorization") || "";
  const apiKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
  let tier: "free" | "paid" = "free"; let callsRemaining = 0;

  if (apiKey && await validateApiKey(env, apiKey)) { tier = "paid"; callsRemaining = -1; }
  else {
    const rc = await checkRateLimit(env, clientIp);
    if (!rc.allowed) return { response: jsonRpcError(id, 429, "Rate limit exceeded. Free tier: 5 calls/day.", { meta: buildMeta("free", 0), upgrade_url: UPGRADE_URL }), status: 429 };
    await new Promise(r => setTimeout(r, FREE_TIER_DELAY_MS));
    callsRemaining = await incrementRateLimit(env, clientIp);
  }

  try {
    const startTime = Date.now();
    const { data, summary } = await executeTool(toolName, toolArgs);
    const endTime = Date.now();
    const meta = buildMeta(tier, callsRemaining);
    ctx.waitUntil(
      fetch(OBSERVATORY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: endTime, method: "tools/call",
          params: { name: "report_interaction", arguments: {
            server_url: SELF_URL + "/mcp", success: true,
            latency_ms: endTime - startTime, tool_name: toolName, http_status: 200,
          }},
        }),
      }).catch(() => {})
    );
    return { response: jsonRpcSuccess(id, { content: [{ type: "text", text: JSON.stringify({ data, meta }, null, 2) }], _meta: { summary } }), status: 200 };
  } catch (error) {
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

      if (request.method === "GET" && path === "/health") {
        return jsonResponse({ status: "ok", service: SERVICE_NAME, version: SERVICE_VERSION, timestamp: new Date().toISOString() });
      }

      if (request.method === "GET" && path === "/.well-known/mcp.json") {
        return jsonResponse({
          name: SERVICE_NAME, version: SERVICE_VERSION,
          description: "MCP server for Singapore weather and ASEAN climate — live NEA 2-hour forecasts, PSI air quality, 24-hour forecasts (via data.gov.sg), and ASEAN regional climate/monsoon data for all 10 ASEAN nations.",
          protocol: "mcp", protocol_version: "2024-11-05", endpoint: "/mcp",
          capabilities: { tools: TOOLS.map(t => ({ name: t.name, description: t.description })) },
          authentication: { type: "bearer", description: "Bearer token for paid tier. Free tier: 5 calls/day with 3s delay." },
          pricing: { free: "5 calls/day", starter: "$29/month", pro: "$99/month", enterprise: "$299/month" },
          upgrade_url: UPGRADE_URL,
          live_data: true,
          data_sources: ["data.gov.sg (NEA)", "MAS Singapore"],
        });
      }

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

      if (request.method === "GET" && path === "/") {
        return jsonResponse({
          service: SERVICE_NAME, version: SERVICE_VERSION,
          description: "Singapore Weather & ASEAN Climate MCP Server — live NEA weather forecasts, PSI air quality, and ASEAN regional climate data for AI agents.",
          endpoints: { "GET /": "Info", "GET /health": "Health check", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" },
          tools: TOOLS.map(t => t.name),
          live_data: "Singapore weather tools use live data.gov.sg APIs. ASEAN climate data is curated reference data.",
          free_tier: "5 calls/day with 3s delay", paid_tier: "Unlimited. Authorization: Bearer daee_sk_xxxxx",
        });
      }

      return jsonResponse({ error: "Not found", available_endpoints: ["/", "/health", "/.well-known/mcp.json", "/mcp"] }, 404);
    } catch (error) {
      return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error), service: SERVICE_NAME, timestamp: new Date().toISOString() }, 500);
    }
  },
};
