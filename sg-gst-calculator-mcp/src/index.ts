// ---------------------------------------------------------------------------
// sg-gst-calculator-mcp — Singapore GST Calculator MCP Server
// ---------------------------------------------------------------------------

interface Env { RATE_LIMIT: KVNamespace; API_KEYS: KVNamespace; }
interface JsonRpcRequest { jsonrpc: "2.0"; id: string | number | null; method: string; params?: Record<string, unknown>; }
interface JsonRpcResponse { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown }; }

const SERVICE_NAME = "sg-gst-calculator-mcp";
const SERVICE_VERSION = "1.0.0";
const UPGRADE_URL = "https://daee-sg-gst.vercel.app";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const SELF_URL = "https://sg-gst-calculator-mcp.sgdata.workers.dev";

// ---------------------------------------------------------------------------
// GST Data (effective 1 Jan 2024 — 9%)
// ---------------------------------------------------------------------------

const CURRENT_GST_RATE = 0.09;
const CURRENT_GST_EFFECTIVE_DATE = "2024-01-01";

interface GstRateHistory {
  rate: number;
  effective_from: string;
  effective_to: string | null;
  notes: string;
}

const GST_RATE_HISTORY: GstRateHistory[] = [
  { rate: 0.09, effective_from: "2024-01-01", effective_to: null, notes: "Current rate. Second phase of GST hike (Budget 2022)." },
  { rate: 0.08, effective_from: "2023-01-01", effective_to: "2023-12-31", notes: "First phase of GST hike from 7% to 9% (Budget 2022)." },
  { rate: 0.07, effective_from: "2007-07-01", effective_to: "2022-12-31", notes: "Rate held for 15+ years." },
  { rate: 0.05, effective_from: "2004-01-01", effective_to: "2007-06-30", notes: "Increased from 4%." },
  { rate: 0.04, effective_from: "2003-01-01", effective_to: "2003-12-31", notes: "Increased from 3%." },
  { rate: 0.03, effective_from: "1994-04-01", effective_to: "2002-12-31", notes: "GST introduced in Singapore." },
];

// Voluntary registration threshold: $0 (any business can register voluntarily)
// Compulsory registration threshold: $1,000,000 turnover
const COMPULSORY_REGISTRATION_THRESHOLD = 1000000;
// Retrospective basis: taxable turnover exceeded $1M in past 12 months
// Prospective basis: taxable turnover expected to exceed $1M in next 12 months

// Reverse charge: applies to imported services from 1 Jan 2020
const REVERSE_CHARGE_EFFECTIVE_DATE = "2020-01-01";
const REVERSE_CHARGE_THRESHOLD = 1000000; // $1M imported services

// GST-exempt supplies
const EXEMPT_SUPPLIES = [
  { category: "Financial Services", examples: ["Interest on loans/deposits", "Life insurance premiums", "Currency exchange margins"], basis: "Fourth Schedule to GST Act" },
  { category: "Residential Property", examples: ["Sale/rental of residential property", "HDB flat transactions"], basis: "Fourth Schedule to GST Act" },
  { category: "Investment Precious Metals", examples: ["Gold bars/wafers (99.5%+ purity)", "Silver bars (99.9%+ purity)", "Platinum bars (99%+ purity)"], basis: "Defined in GST (IPM) Regulations" },
];

// Zero-rated supplies
const ZERO_RATED_SUPPLIES = [
  { category: "Exports", examples: ["Goods shipped overseas", "International transport services"], basis: "Section 21(3) GST Act" },
  { category: "International Services", examples: ["Services provided to overseas persons", "Offshore supplies"], basis: "Section 21(3) GST Act" },
];

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function calculateGst(args: Record<string, unknown>) {
  const amount = Number(args.amount) || 0;
  if (amount <= 0) throw new Error("amount must be positive");

  const isInclusive = args.gst_inclusive === true;
  const customRate = args.custom_rate !== undefined ? Number(args.custom_rate) / 100 : null;
  const rate = customRate !== null ? customRate : CURRENT_GST_RATE;

  let gstExclusiveAmount: number;
  let gstAmount: number;
  let gstInclusiveAmount: number;

  if (isInclusive) {
    gstInclusiveAmount = amount;
    gstExclusiveAmount = Math.round((amount / (1 + rate)) * 100) / 100;
    gstAmount = Math.round((gstInclusiveAmount - gstExclusiveAmount) * 100) / 100;
  } else {
    gstExclusiveAmount = amount;
    gstAmount = Math.round((amount * rate) * 100) / 100;
    gstInclusiveAmount = Math.round((gstExclusiveAmount + gstAmount) * 100) / 100;
  }

  return {
    input: { amount, gst_inclusive: isInclusive, rate_used: `${(rate * 100).toFixed(1)}%` },
    calculation: {
      gst_exclusive_amount: gstExclusiveAmount,
      gst_amount: gstAmount,
      gst_inclusive_amount: gstInclusiveAmount,
    },
    current_gst_rate: `${(CURRENT_GST_RATE * 100).toFixed(0)}%`,
    effective_date: CURRENT_GST_EFFECTIVE_DATE,
    invoicing_note: "GST-registered businesses must display GST amount separately on tax invoices. Tax invoice required for supplies > SGD 1,000.",
    summary: isInclusive
      ? `GST-inclusive $${amount}: GST amount = $${gstAmount}, before GST = $${gstExclusiveAmount} (rate: ${(rate * 100).toFixed(1)}%).`
      : `GST on $${amount}: GST = $${gstAmount}, total = $${gstInclusiveAmount} (rate: ${(rate * 100).toFixed(1)}%).`,
  };
}

function checkGstRegistration(args: Record<string, unknown>) {
  const annualTurnover = Number(args.annual_turnover) || 0;
  const projectedTurnover = args.projected_turnover !== undefined ? Number(args.projected_turnover) : null;
  const isVoluntary = args.consider_voluntary === true;
  const hasOverseasRevenue = args.has_overseas_revenue === true;

  const retrospectiveRequired = annualTurnover > COMPULSORY_REGISTRATION_THRESHOLD;
  const prospectiveRequired = projectedTurnover !== null && projectedTurnover > COMPULSORY_REGISTRATION_THRESHOLD;
  const mustRegister = retrospectiveRequired || prospectiveRequired;

  const voluntaryBenefits = [
    "Claim input GST on business purchases",
    "Appear more established to business clients",
    "Required for government procurement (some contracts)",
  ];
  const voluntaryDrawbacks = [
    "Must charge GST to customers (may affect pricing competitiveness for B2C)",
    "Additional compliance obligations (quarterly GST returns)",
    "Must remain registered for minimum 2 years",
    "Penalties for late filing or non-compliance",
  ];

  return {
    input: {
      annual_turnover: annualTurnover,
      projected_turnover: projectedTurnover,
      consider_voluntary: isVoluntary,
    },
    registration_status: {
      compulsory_threshold: COMPULSORY_REGISTRATION_THRESHOLD,
      retrospective_test: { exceeded: retrospectiveRequired, basis: "Taxable turnover in past 12 months exceeded $1,000,000" },
      prospective_test: projectedTurnover !== null
        ? { exceeded: prospectiveRequired, basis: "Taxable turnover in next 12 months expected to exceed $1,000,000" }
        : null,
      must_register: mustRegister,
      deadline: mustRegister ? "Within 30 days of liability to register" : null,
    },
    voluntary_registration: isVoluntary && !mustRegister ? {
      eligible: true,
      benefits: voluntaryBenefits,
      drawbacks: voluntaryDrawbacks,
      minimum_period: "2 years",
      note: "Voluntary registration requires IRAS approval. Must demonstrate intent to make taxable supplies.",
    } : null,
    overseas_vendor_registration: hasOverseasRevenue ? {
      applies: true,
      threshold: "$100,000 in B2C digital services to Singapore consumers",
      note: "Overseas Vendor Registration (OVR) regime applies from 1 Jan 2023 for digital services and from 1 Jan 2023 for low-value goods.",
    } : null,
    penalties: {
      late_registration: "Fine up to $10,000 and/or imprisonment up to 7 years",
      late_filing: "$200 per month (max $10,000) for outstanding returns",
      tax_evasion: "Fine up to 3x tax undercharged and/or imprisonment up to 7 years",
    },
    summary: mustRegister
      ? `MUST REGISTER. Annual turnover $${annualTurnover.toLocaleString()} ${retrospectiveRequired ? "exceeds" : "is below"} $1M threshold. ${prospectiveRequired ? "Projected turnover also exceeds threshold." : ""} Register within 30 days.`
      : `NOT required to register. Annual turnover $${annualTurnover.toLocaleString()} is below $1M threshold.${isVoluntary ? " Voluntary registration is an option." : ""}`,
  };
}

function getGstRates(args: Record<string, unknown>) {
  const asOfDate = args.as_of_date as string | undefined;

  let applicableRate = GST_RATE_HISTORY[0]; // current
  if (asOfDate) {
    const target = new Date(asOfDate);
    for (const rate of GST_RATE_HISTORY) {
      const from = new Date(rate.effective_from);
      const to = rate.effective_to ? new Date(rate.effective_to) : new Date("2099-12-31");
      if (target >= from && target <= to) {
        applicableRate = rate;
        break;
      }
    }
  }

  return {
    current_rate: {
      rate: `${(CURRENT_GST_RATE * 100).toFixed(0)}%`,
      effective_from: CURRENT_GST_EFFECTIVE_DATE,
      decimal: CURRENT_GST_RATE,
    },
    queried_date: asOfDate || null,
    applicable_rate: asOfDate ? {
      rate: `${(applicableRate.rate * 100).toFixed(0)}%`,
      effective_from: applicableRate.effective_from,
      effective_to: applicableRate.effective_to,
      notes: applicableRate.notes,
    } : null,
    rate_history: GST_RATE_HISTORY.map(r => ({
      rate: `${(r.rate * 100).toFixed(1)}%`,
      effective_from: r.effective_from,
      effective_to: r.effective_to || "Present",
      notes: r.notes,
    })),
    exempt_supplies: EXEMPT_SUPPLIES,
    zero_rated_supplies: ZERO_RATED_SUPPLIES,
    key_dates: {
      gst_introduced: "1994-04-01",
      latest_change: "2024-01-01 (7% → 9%)",
      next_planned_change: "None announced",
    },
    summary: asOfDate
      ? `GST rate as of ${asOfDate}: ${(applicableRate.rate * 100).toFixed(0)}%. Current rate: ${(CURRENT_GST_RATE * 100).toFixed(0)}% (from ${CURRENT_GST_EFFECTIVE_DATE}).`
      : `Current Singapore GST rate: ${(CURRENT_GST_RATE * 100).toFixed(0)}% (from ${CURRENT_GST_EFFECTIVE_DATE}). 6 rate changes since 1994.`,
  };
}

function calculateReverseCharge(args: Record<string, unknown>) {
  const importedServicesValue = Number(args.imported_services_value) || 0;
  const totalTaxableTurnover = Number(args.total_taxable_turnover) || 0;
  const isGstRegistered = args.is_gst_registered === true;

  if (importedServicesValue <= 0) throw new Error("imported_services_value must be positive");

  const gstOnImportedServices = Math.round(importedServicesValue * CURRENT_GST_RATE * 100) / 100;

  // Reverse charge applies if:
  // 1. Business is GST-registered (or would be if imported services counted towards threshold)
  // 2. Non-entitled to full input tax credit (i.e., makes exempt supplies)
  const wouldExceedThreshold = (totalTaxableTurnover + importedServicesValue) > REVERSE_CHARGE_THRESHOLD;

  return {
    input: {
      imported_services_value: importedServicesValue,
      total_taxable_turnover: totalTaxableTurnover,
      is_gst_registered: isGstRegistered,
    },
    reverse_charge: {
      gst_rate: `${(CURRENT_GST_RATE * 100).toFixed(0)}%`,
      gst_payable: gstOnImportedServices,
      effective_since: REVERSE_CHARGE_EFFECTIVE_DATE,
      applies_to: "Imported services from overseas suppliers where the recipient is GST-registered or liable to register",
    },
    registration_impact: !isGstRegistered ? {
      combined_turnover: totalTaxableTurnover + importedServicesValue,
      threshold: REVERSE_CHARGE_THRESHOLD,
      would_trigger_registration: wouldExceedThreshold,
      note: wouldExceedThreshold
        ? "Including imported services pushes total above $1M threshold. May need to register for GST."
        : "Combined turnover still below $1M. No registration obligation from reverse charge alone.",
    } : null,
    input_tax_credit: isGstRegistered ? {
      note: "If fully entitled to input tax credit (no exempt supplies), reverse charge GST is claimable as input tax. Net effect is zero.",
      partially_exempt: "If making exempt supplies, only proportionate credit available. Consult IRAS guidelines.",
    } : null,
    filing: {
      box: "Box 1 (Total value of standard-rated supplies) must include value of imported services",
      frequency: "Quarterly GST returns (GST F5)",
      deadline: "Within one month after end of prescribed accounting period",
    },
    summary: `Reverse charge GST on $${importedServicesValue.toLocaleString()} imported services: $${gstOnImportedServices} at ${(CURRENT_GST_RATE * 100).toFixed(0)}%.${!isGstRegistered && wouldExceedThreshold ? " WARNING: May trigger GST registration." : ""}`,
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "calculate_gst",
    description: "Calculate Singapore GST (Goods and Services Tax) amount for any transaction. Supports both GST-inclusive (extract GST from total) and GST-exclusive (add GST to base) calculations. Use this tool when you need to compute GST for invoicing, pricing, or accounting in Singapore.",
    inputSchema: {
      type: "object" as const,
      properties: {
        amount: { type: "number", description: "Transaction amount in SGD." },
        gst_inclusive: { type: "boolean", description: "If true, amount includes GST (extract GST from total). If false/omitted, GST is added on top." },
        custom_rate: { type: "number", description: "Custom GST rate as percentage (e.g. 8 for 8%). Defaults to current 9%." },
      },
      required: ["amount"],
    },
  },
  {
    name: "check_gst_registration",
    description: "Determine if a Singapore business must register for GST based on annual and projected taxable turnover. Returns compulsory registration status, voluntary registration analysis, and penalty information. Use this tool when you need to check whether a business has crossed the $1M GST registration threshold.",
    inputSchema: {
      type: "object" as const,
      properties: {
        annual_turnover: { type: "number", description: "Annual taxable turnover in SGD (past 12 months)." },
        projected_turnover: { type: "number", description: "Projected taxable turnover for next 12 months in SGD (optional)." },
        consider_voluntary: { type: "boolean", description: "If true, include voluntary registration analysis for businesses below threshold." },
        has_overseas_revenue: { type: "boolean", description: "If true, include Overseas Vendor Registration guidance." },
      },
      required: ["annual_turnover"],
    },
  },
  {
    name: "get_gst_rates",
    description: "Get current and historical Singapore GST rates, exempt supplies, and zero-rated supplies. Optionally check what rate applied on a specific date. Use this tool when you need to look up GST rates for calculations, historical analysis, or compliance documentation.",
    inputSchema: {
      type: "object" as const,
      properties: {
        as_of_date: { type: "string", description: "Date in YYYY-MM-DD format to look up the applicable GST rate. Omit for current rate and full history." },
      },
    },
  },
  {
    name: "calculate_reverse_charge",
    description: "Calculate reverse charge GST on imported services from overseas suppliers. Determines GST payable, registration impact, and input tax credit eligibility. Use this tool when you need to assess GST obligations on services purchased from foreign vendors by Singapore businesses.",
    inputSchema: {
      type: "object" as const,
      properties: {
        imported_services_value: { type: "number", description: "Total value of imported services in SGD." },
        total_taxable_turnover: { type: "number", description: "Business total taxable turnover in SGD (to assess registration threshold impact)." },
        is_gst_registered: { type: "boolean", description: "Whether the business is already GST-registered." },
      },
      required: ["imported_services_value"],
    },
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
      "sg-company-lookup": "https://sg-company-lookup-mcp.sgdata.workers.dev",
      "sg-cpf-calculator": "https://sg-cpf-calculator-mcp.sgdata.workers.dev",
      "asean-trade-rules": "https://asean-trade-rules-mcp.sgdata.workers.dev",
      "sg-workpass-compass": "https://sg-workpass-compass-mcp.sgdata.workers.dev",
    },
    trust_score_url: `https://dominion-observatory.sgdata.workers.dev/api/trust?url=${encodeURIComponent(SELF_URL)}`,
    observatory: "https://dominion-observatory.sgdata.workers.dev",
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

function executeTool(name: string, args: Record<string, unknown>): { data: unknown; summary: string } {
  switch (name) {
    case "calculate_gst": { const r = calculateGst(args); return { data: r, summary: r.summary }; }
    case "check_gst_registration": { const r = checkGstRegistration(args); return { data: r, summary: r.summary }; }
    case "get_gst_rates": { const r = getGstRates(args); return { data: r, summary: r.summary }; }
    case "calculate_reverse_charge": { const r = calculateReverseCharge(args); return { data: r, summary: r.summary }; }
    default: throw new Error(`Unknown tool: ${name}`);
  }
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

async function handleMcp(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: JsonRpcRequest;
  try { body = (await request.json()) as JsonRpcRequest; } catch { return jsonResponse(jsonRpcError(null, -32700, "Parse error"), 400); }
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
        description: "MCP server for Singapore GST calculations — compute GST amounts, check registration obligations, get historical rates, and calculate reverse charge on imported services.",
        protocol: "mcp", protocol_version: "2024-11-05", endpoint: "/mcp",
        capabilities: { tools: TOOLS.map(t => ({ name: t.name, description: t.description })) },
        authentication: { type: "bearer", description: "Bearer token for paid tier. Free tier: 5 calls/day with 3s delay." },
        pricing: { free: "5 calls/day, 3s delay", starter: "$29/month - 1,000 calls", pro: "$99/month - 10,000 calls", enterprise: "$299/month - unlimited" },
        upgrade_url: UPGRADE_URL,
      });

      if (request.method === "POST" && path === "/mcp") return await handleMcp(request, env, ctx);

      if (request.method === "GET" && path === "/") return jsonResponse({
        service: SERVICE_NAME, version: SERVICE_VERSION,
        description: "Singapore GST Calculator MCP Server — GST calculations, registration threshold checks, rate history, and reverse charge for AI agents.",
        endpoints: { "GET /": "Info", "GET /health": "Health", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" },
        tools: TOOLS.map(t => t.name), documentation: UPGRADE_URL,
      });

      return jsonResponse({ error: "Not found", available_endpoints: ["/", "/health", "/.well-known/mcp.json", "/mcp"] }, 404);
    } catch (error) { return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error), service: SERVICE_NAME, timestamp: new Date().toISOString() }, 500); }
  },
};
