import {
  RCEP_MEMBERS, CPTPP_MEMBERS, ASEAN_MEMBERS, SG_BILATERAL_FTAS,
  COUNTRY_ALIASES, HS_CATEGORIES, MFN_RATES, DOCUMENTATION, SG_SPECIFIC_DOCS,
} from "./data";

interface Env { RATE_LIMIT: KVNamespace; API_KEYS: KVNamespace; }
interface JsonRpcRequest { jsonrpc: "2.0"; id: string | number | null; method: string; params?: Record<string, unknown>; }
interface JsonRpcResponse { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown }; }

const SERVICE_NAME = "asean-trade-rules-mcp";
const SERVICE_VERSION = "1.0.0";
const UPGRADE_URL = "https://daee-asean-trade.vercel.app";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const SELF_URL = "https://asean-trade-rules-mcp.sgdata.workers.dev";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeCountry(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return COUNTRY_ALIASES[trimmed.toLowerCase()] || trimmed.toUpperCase().slice(0, 2);
}

function getHsChapter(hsCode: string): number {
  const cleaned = hsCode.replace(/[.\-\s]/g, "");
  return parseInt(cleaned.slice(0, 2), 10);
}

function getHsCategory(chapter: number) {
  for (const cat of HS_CATEGORIES) {
    const [start, end] = cat.chapters.split("-").map(Number);
    if (chapter >= start && chapter <= end) return cat;
  }
  return null;
}

function getApplicableFtas(origin: string, destination: string) {
  const ftas: { name: string; type: string; members: number; year?: number }[] = [];
  if (RCEP_MEMBERS.includes(origin) && RCEP_MEMBERS.includes(destination)) {
    ftas.push({ name: "RCEP", type: "multilateral", members: 15 });
  }
  if (CPTPP_MEMBERS.includes(origin) && CPTPP_MEMBERS.includes(destination)) {
    ftas.push({ name: "CPTPP", type: "multilateral", members: 12 });
  }
  if (ASEAN_MEMBERS.includes(origin) && ASEAN_MEMBERS.includes(destination)) {
    ftas.push({ name: "AFTA/ATIGA", type: "regional", members: 10 });
  }
  if (origin === "SG" && SG_BILATERAL_FTAS[destination]) {
    const b = SG_BILATERAL_FTAS[destination];
    ftas.push({ name: b.name, type: "bilateral", members: 2, year: b.year });
  } else if (destination === "SG" && SG_BILATERAL_FTAS[origin]) {
    const b = SG_BILATERAL_FTAS[origin];
    ftas.push({ name: b.name, type: "bilateral", members: 2, year: b.year });
  }
  return ftas;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "check_fta_eligibility",
    description: "Given HS code + origin + destination, return applicable FTAs with tariff rates. Use this tool when you need to determine which free trade agreements apply to a product traded in Asia-Pacific.",
    inputSchema: {
      type: "object" as const,
      properties: {
        hs_code: { type: "string", description: "HS code (2-10 digits)" },
        origin_country: { type: "string", description: "Country of origin (ISO 2-letter code or name)" },
        destination_country: { type: "string", description: "Destination country (ISO 2-letter code or name)" },
      },
      required: ["hs_code", "origin_country", "destination_country"],
    },
  },
  {
    name: "get_rules_of_origin",
    description: "Product-specific rules for qualifying under each FTA. Use this tool when you need to verify whether a product meets origin requirements for preferential tariffs.",
    inputSchema: {
      type: "object" as const,
      properties: {
        hs_code: { type: "string", description: "HS code (2-10 digits)" },
        fta: { type: "string", description: "FTA name: RCEP, CPTPP, AFTA, USSFTA, EUSFTA, etc." },
      },
      required: ["hs_code", "fta"],
    },
  },
  {
    name: "calculate_tariff_savings",
    description: "Compare MFN rate vs preferential rate for a product-route. Use this tool when you need to quantify the financial benefit of using a free trade agreement.",
    inputSchema: {
      type: "object" as const,
      properties: {
        hs_code: { type: "string", description: "HS code (2-10 digits)" },
        origin_country: { type: "string", description: "Country of origin" },
        destination_country: { type: "string", description: "Destination country" },
        shipment_value_usd: { type: "number", description: "Shipment value in USD" },
      },
      required: ["hs_code", "origin_country", "destination_country", "shipment_value_usd"],
    },
  },
  {
    name: "get_documentation_requirements",
    description: "Required certificates and forms for each FTA. Use this tool when you need to know what paperwork is required to claim preferential tariff treatment.",
    inputSchema: {
      type: "object" as const,
      properties: {
        fta: { type: "string", description: "FTA name: RCEP, CPTPP, AFTA, USSFTA, EUSFTA" },
        origin_country: { type: "string", description: "Country of origin (optional, for SG-specific guidance)" },
      },
      required: ["fta"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

function executeTool(name: string, args: Record<string, unknown>): { data: unknown; summary: string } {
  switch (name) {
    case "check_fta_eligibility": return toolCheckFtaEligibility(args);
    case "get_rules_of_origin": return toolGetRulesOfOrigin(args);
    case "calculate_tariff_savings": return toolCalculateTariffSavings(args);
    case "get_documentation_requirements": return toolGetDocumentation(args);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

function toolCheckFtaEligibility(args: Record<string, unknown>): { data: unknown; summary: string } {
  const hsCode = (args.hs_code as string || "").replace(/[.\-\s]/g, "");
  const origin = normalizeCountry(args.origin_country as string || "");
  const dest = normalizeCountry(args.destination_country as string || "");
  if (!hsCode || hsCode.length < 2) throw new Error("hs_code must be at least 2 digits");

  const chapter = getHsChapter(hsCode);
  const category = getHsCategory(chapter);
  const ftas = getApplicableFtas(origin, dest);

  const ftaDetails = ftas.map((fta) => ({
    ...fta,
    tariff_treatment: category
      ? fta.name === "CPTPP" ? category.cptpp : category.rcep
      : "unknown",
    product_category: category?.name || "Unknown",
    sensitivity: category?.sensitivity || "unknown",
  }));

  return {
    data: {
      hs_code: hsCode, hs_chapter: chapter, origin, destination: dest,
      product_category: category?.name || "Unknown HS chapter",
      applicable_ftas: ftaDetails,
      fta_count: ftas.length,
      recommendation: ftas.length > 0
        ? `${ftas.length} FTA(s) available. ${ftas.some(f => f.name === "CPTPP") ? "CPTPP generally offers deepest tariff cuts (99% elimination)." : "RCEP covers 92% tariff lines over 20 years."}`
        : "No FTA coverage found between these countries for preferential tariff treatment.",
    },
    summary: `HS ${hsCode} from ${origin} to ${dest}: ${ftas.length} FTA(s) applicable — ${ftas.map(f => f.name).join(", ") || "none"}.`,
  };
}

function toolGetRulesOfOrigin(args: Record<string, unknown>): { data: unknown; summary: string } {
  const hsCode = (args.hs_code as string || "").replace(/[.\-\s]/g, "");
  const fta = (args.fta as string || "").toUpperCase();
  const chapter = getHsChapter(hsCode);
  const category = getHsCategory(chapter);

  const isTextile = chapter >= 50 && chapter <= 63;
  const isAuto = chapter === 87;
  const isElectronics = chapter >= 84 && chapter <= 85;

  let rules: Record<string, unknown>;

  if (fta === "RCEP") {
    rules = {
      fta: "RCEP", general_rule: "Regional Value Content (RVC) >= 40% OR Change in Tariff Classification (CTC) at HS 4-digit level",
      rvc_threshold: "40%", rvc_method: "Build-up or Build-down",
      ctc_level: "Change in Tariff Heading (CTH) — 4-digit level",
      cumulation: "Full cumulation among all 15 RCEP members",
      de_minimis: "10% of FOB value for non-originating materials",
      special_rules: isTextile
        ? { note: "Textiles (HS 50-63): Specific Product-Specific Rules apply. Generally requires processing from yarn stage within RCEP." }
        : isAuto
        ? { note: "Automotive (HS 87): RVC 40% initially, rising to 50% after 15 years for some parties. Product-specific rules apply." }
        : isElectronics
        ? { note: "Electronics (HS 84-85): CTC at 4-digit or RVC 40%. Most electronics qualify easily." }
        : null,
    };
  } else if (fta === "CPTPP") {
    rules = {
      fta: "CPTPP", general_rule: "RVC >= 45% (build-up) or >= 35% (build-down) OR CTC varies by product",
      rvc_build_up: "45%", rvc_build_down: "35%",
      ctc_level: "Varies by product — check Annex 3-D of CPTPP",
      cumulation: "Full cumulation among CPTPP members",
      de_minimis: "10% of transaction value",
      special_rules: isTextile
        ? { note: "Textiles (HS 50-63): 'Yarn-forward' rule — yarn must be formed in a CPTPP country. Short supply list exceptions available." }
        : isAuto
        ? { note: "Automotive (HS 87): RVC 75% for vehicles. Phased in over time. Steel/aluminum requirements apply." }
        : isElectronics
        ? { note: "Electronics (HS 84-85): Generally CTC at 4-digit or RVC 45%. Most ITA products already duty-free." }
        : null,
    };
  } else if (fta === "AFTA" || fta === "ATIGA") {
    rules = {
      fta: "AFTA/ATIGA", general_rule: "RVC >= 40% OR CTC at HS 4-digit level",
      rvc_threshold: "40%", ctc_level: "Change in Tariff Heading (CTH) — 4-digit level",
      cumulation: "ASEAN cumulation — materials from any ASEAN member count as originating",
      de_minimis: "10% of FOB value",
      special_rules: isAuto
        ? { note: "Automotive: ASEAN members maintain varying exclusion lists. Check national schedules." }
        : null,
    };
  } else {
    rules = {
      fta: fta,
      note: `Specific rules for ${fta} not in database. Common FTAs: RCEP, CPTPP, AFTA, USSFTA, EUSFTA.`,
      general_guidance: "Most FTAs use RVC 35-45% or CTC at 4-digit level as general qualifying criteria.",
    };
  }

  return {
    data: { hs_code: hsCode, hs_chapter: chapter, product_category: category?.name || "Unknown", rules_of_origin: rules },
    summary: `Rules of origin for HS ${hsCode} under ${fta}: ${fta === "RCEP" ? "RVC>=40% or CTC" : fta === "CPTPP" ? "RVC>=45%/35% or CTC" : "RVC>=40% or CTC"}.`,
  };
}

function toolCalculateTariffSavings(args: Record<string, unknown>): { data: unknown; summary: string } {
  const hsCode = (args.hs_code as string || "").replace(/[.\-\s]/g, "");
  const origin = normalizeCountry(args.origin_country as string || "");
  const dest = normalizeCountry(args.destination_country as string || "");
  const value = args.shipment_value_usd as number || 0;
  if (value <= 0) throw new Error("shipment_value_usd must be positive");

  const destRates = MFN_RATES[dest];
  if (!destRates) throw new Error(`No tariff data for destination: ${dest}. Available: ${Object.keys(MFN_RATES).join(", ")}`);

  const ftas = getApplicableFtas(origin, dest);
  const mfnDuty = value * (destRates.avg_mfn / 100);

  const savings = ftas.map((fta) => {
    const prefRate = fta.name === "CPTPP" ? destRates.pref_cptpp : destRates.pref_rcep;
    const prefDuty = value * (prefRate / 100);
    const saved = mfnDuty - prefDuty;
    return {
      fta: fta.name, preferential_rate_pct: prefRate,
      preferential_duty_usd: Math.round(prefDuty * 100) / 100,
      savings_usd: Math.round(saved * 100) / 100,
      savings_pct: Math.round((saved / Math.max(mfnDuty, 0.01)) * 10000) / 100,
    };
  });

  const bestFta = savings.reduce((best, s) => s.savings_usd > best.savings_usd ? s : best, savings[0] || { fta: "none", savings_usd: 0 });

  return {
    data: {
      hs_code: hsCode, origin, destination: dest, shipment_value_usd: value,
      mfn_rate_pct: destRates.avg_mfn, mfn_duty_usd: Math.round(mfnDuty * 100) / 100,
      fta_comparisons: savings,
      best_option: bestFta.fta !== "none" ? { fta: bestFta.fta, savings_usd: bestFta.savings_usd } : null,
      note: dest === "SG" ? "Singapore is a free port with 0% MFN on nearly all goods. No FTA savings applicable." : undefined,
    },
    summary: bestFta.fta !== "none"
      ? `Best FTA: ${bestFta.fta} saves USD ${bestFta.savings_usd} on USD ${value} shipment (${dest} MFN ${destRates.avg_mfn}%).`
      : `No FTA coverage for ${origin} to ${dest}. MFN duty: USD ${Math.round(mfnDuty * 100) / 100}.`,
  };
}

function toolGetDocumentation(args: Record<string, unknown>): { data: unknown; summary: string } {
  const fta = (args.fta as string || "").toUpperCase();
  const origin = args.origin_country ? normalizeCountry(args.origin_country as string) : null;

  const docs = DOCUMENTATION[fta];
  if (!docs) {
    return {
      data: { fta, available_ftas: Object.keys(DOCUMENTATION), note: `Documentation for ${fta} not in database.` },
      summary: `No documentation data for ${fta}. Available: ${Object.keys(DOCUMENTATION).join(", ")}.`,
    };
  }

  const result: Record<string, unknown> = {
    fta, ...docs,
    singapore_specific: origin === "SG" || !origin ? SG_SPECIFIC_DOCS : undefined,
  };

  return {
    data: result,
    summary: `${fta} requires: ${docs.certificate}. Certification: ${docs.certification_type}.`,
  };
}

// ---------------------------------------------------------------------------
// Meta, rate limiting, JSON-RPC — same pattern as other DAEE ventures
// ---------------------------------------------------------------------------

function buildMeta(tier: "free" | "paid", callsRemainingToday: number) {
  return {
    tier, calls_remaining_today: callsRemainingToday,
    timestamp: new Date().toISOString(), source: SERVICE_NAME, version: SERVICE_VERSION,
    upgrade_url: UPGRADE_URL,
    pricing: { starter: "$29/month - 1,000 calls/month", pro: "$99/month - 10,000 calls/month", enterprise: "$299/month - unlimited calls" },
    related_tools: { "sg-regulatory-data": "https://sg-regulatory-data-mcp.sgdata.workers.dev", "sg-company-lookup": "https://sg-company-lookup-mcp.sgdata.workers.dev", "sg-cpf-calculator": "https://sg-cpf-calculator-mcp.sgdata.workers.dev", "sg-workpass-compass": "https://sg-workpass-compass-mcp.sgdata.workers.dev" },
    trust_score_url: `https://dominion-observatory.sgdata.workers.dev/api/trust?url=${encodeURIComponent(SELF_URL)}`,
    observatory: "https://dominion-observatory.sgdata.workers.dev",
  };
}

function getTodayKey(ip: string): string { return `rate:${ip}:${new Date().toISOString().split("T")[0]}`; }

async function checkRateLimit(env: Env, ip: string) {
  try { const raw = await env.RATE_LIMIT.get(getTodayKey(ip)); const used = raw ? parseInt(raw, 10) : 0; return { allowed: used < FREE_TIER_DAILY_LIMIT, callsUsed: used, callsRemaining: Math.max(0, FREE_TIER_DAILY_LIMIT - used) }; }
  catch { return { allowed: true, callsUsed: 0, callsRemaining: FREE_TIER_DAILY_LIMIT }; }
}

async function incrementRateLimit(env: Env, ip: string): Promise<number> {
  try { const key = getTodayKey(ip); const next = ((await env.RATE_LIMIT.get(key)) ? parseInt((await env.RATE_LIMIT.get(key))!, 10) : 0) + 1; await env.RATE_LIMIT.put(key, String(next), { expirationTtl: 86400 }); return Math.max(0, FREE_TIER_DAILY_LIMIT - next); }
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

async function handleToolCall(id: string | number | null, params: Record<string, unknown>, env: Env, request: Request, ctx: ExecutionContext) {
  const toolName = params.name as string;
  const toolArgs = (params.arguments as Record<string, unknown>) || {};
  const startTime = Date.now();
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
    ctx.waitUntil(
      fetch(OBSERVATORY_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name: "report_interaction", arguments: { server_url: SELF_URL, success: true, latency_ms: Date.now() - startTime, tool_name: toolName, http_status: 200 } } }) }).catch(() => {})
    );
    return { response: jsonRpcSuccess(id, { content: [{ type: "text", text: JSON.stringify({ data, meta: buildMeta(tier, callsRemaining) }, null, 2) }], _meta: { summary } }), status: 200 };
  } catch (error) {
    ctx.waitUntil(
      fetch(OBSERVATORY_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name: "report_interaction", arguments: { server_url: SELF_URL, success: false, latency_ms: Date.now() - startTime, tool_name: toolName, http_status: 500 } } }) }).catch(() => {})
    );
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
      if (request.method === "GET" && path === "/.well-known/mcp.json") return jsonResponse({ name: SERVICE_NAME, version: SERVICE_VERSION, description: "MCP server for ASEAN trade rules — RCEP, CPTPP, AFTA FTA eligibility, rules of origin, tariff savings, and documentation requirements.", protocol: "mcp", protocol_version: "2024-11-05", endpoint: "/mcp", capabilities: { tools: TOOLS.map(t => ({ name: t.name, description: t.description })) }, authentication: { type: "bearer" }, pricing: { free: "5 calls/day", starter: "$29/month", pro: "$99/month", enterprise: "$299/month" }, upgrade_url: UPGRADE_URL });

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

      if (request.method === "GET" && path === "/") return jsonResponse({ service: SERVICE_NAME, version: SERVICE_VERSION, description: "ASEAN Trade Rules MCP Server — FTA eligibility checks, rules of origin, tariff savings calculations, and documentation requirements for RCEP, CPTPP, AFTA and Singapore bilateral FTAs.", endpoints: { "GET /": "Info", "GET /health": "Health check", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" }, tools: TOOLS.map(t => t.name) });

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) { return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }, 500); }
  },
};
