// ---------------------------------------------------------------------------
// sg-gst-calculator-mcp — Singapore GST Calculator MCP Server
// ---------------------------------------------------------------------------

interface Env {
  RATE_LIMIT: KVNamespace;
  API_KEYS: KVNamespace;
  OBSERVATORY: Fetcher;
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface ResponseMeta {
  tier: "free" | "paid";
  calls_remaining_today: number;
  timestamp: string;
  source: string;
  version: string;
  upgrade_url: string;
  pricing: { starter: string; pro: string; enterprise: string };
  related_tools: Record<string, string>;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_NAME = "sg-gst-calculator-mcp";
const SERVICE_VERSION = "1.1.0";
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/api/report";
const SELF_URL = "https://sg-gst-calculator-mcp.sgdata.workers.dev";

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

const UPGRADE_URL = "https://daee-sg-gst.pages.dev";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;

// ---------------------------------------------------------------------------
// GST Rate Data
// ---------------------------------------------------------------------------

const CURRENT_GST_RATE = 0.09; // 9% since 1 Jan 2024

interface GstRateHistoryEntry {
  period: string;
  rate_percent: number;
  rate_decimal: number;
  start_date: string;
  end_date: string | null;
}

const GST_RATE_HISTORY: GstRateHistoryEntry[] = [
  { period: "1 Apr 1994 - 31 Dec 2002", rate_percent: 3, rate_decimal: 0.03, start_date: "1994-04-01", end_date: "2002-12-31" },
  { period: "1 Jan 2003 - 31 Dec 2003", rate_percent: 4, rate_decimal: 0.04, start_date: "2003-01-01", end_date: "2003-12-31" },
  { period: "1 Jan 2004 - 30 Jun 2007", rate_percent: 5, rate_decimal: 0.05, start_date: "2004-01-01", end_date: "2007-06-30" },
  { period: "1 Jul 2007 - 31 Dec 2022", rate_percent: 7, rate_decimal: 0.07, start_date: "2007-07-01", end_date: "2022-12-31" },
  { period: "1 Jan 2023 - 31 Dec 2023", rate_percent: 8, rate_decimal: 0.08, start_date: "2023-01-01", end_date: "2023-12-31" },
  { period: "1 Jan 2024 onwards", rate_percent: 9, rate_decimal: 0.09, start_date: "2024-01-01", end_date: null },
];

const ZERO_RATED_SUPPLIES = [
  "Export of goods",
  "International services (e.g., services supplied to overseas persons)",
  "Supply of goods within Free Trade Zones for export",
];

const EXEMPT_SUPPLIES = [
  "Sale and rental of unfurnished residential property",
  "Financial services (e.g., issue of debt/equity securities, life insurance premiums)",
  "Supply of digital payment tokens",
  "Imported non-digital services exempt from GST",
];

const GST_REGISTRATION_THRESHOLD = 1000000; // $1,000,000

function findGstRateForDate(dateStr: string): GstRateHistoryEntry | null {
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  for (let i = GST_RATE_HISTORY.length - 1; i >= 0; i--) {
    const entry = GST_RATE_HISTORY[i];
    const start = new Date(entry.start_date);
    const end = entry.end_date ? new Date(entry.end_date) : new Date("9999-12-31");
    if (target >= start && target <= end) return entry;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function calculateGst(args: Record<string, unknown>) {
  const amount = Number(args.amount) || 0;
  const inclusive = args.inclusive === true;

  if (amount < 0) {
    return { error: "Amount must be non-negative", summary: "Invalid amount provided." };
  }

  let baseAmount: number;
  let gstAmount: number;
  let totalAmount: number;

  if (inclusive) {
    // GST-inclusive: extract GST from the total
    baseAmount = Math.round((amount / (1 + CURRENT_GST_RATE)) * 100) / 100;
    gstAmount = Math.round((amount - baseAmount) * 100) / 100;
    totalAmount = amount;
  } else {
    // GST-exclusive: add GST to the base
    baseAmount = amount;
    gstAmount = Math.round((amount * CURRENT_GST_RATE) * 100) / 100;
    totalAmount = Math.round((amount + gstAmount) * 100) / 100;
  }

  return {
    input: { amount, inclusive },
    gst_rate: `${CURRENT_GST_RATE * 100}%`,
    base_amount: baseAmount,
    gst_amount: gstAmount,
    total_amount: totalAmount,
    calculation_type: inclusive ? "GST extracted from inclusive amount" : "GST added to exclusive amount",
    effective_date: "2024-01-01",
    summary: inclusive
      ? `GST-inclusive $${amount}: Base $${baseAmount} + GST $${gstAmount} = Total $${totalAmount} (at ${CURRENT_GST_RATE * 100}%).`
      : `GST-exclusive $${amount}: Base $${baseAmount} + GST $${gstAmount} = Total $${totalAmount} (at ${CURRENT_GST_RATE * 100}%).`,
  };
}

function checkGstRegistration(args: Record<string, unknown>) {
  const annualTurnover = Number(args.annual_turnover) || 0;
  const projectedTurnover = args.projected_turnover !== undefined ? Number(args.projected_turnover) : null;

  const retrospectiveRequired = annualTurnover > GST_REGISTRATION_THRESHOLD;
  const prospectiveRequired = projectedTurnover !== null && projectedTurnover > GST_REGISTRATION_THRESHOLD;
  const registrationRequired = retrospectiveRequired || prospectiveRequired;

  const reasons: string[] = [];
  if (retrospectiveRequired) {
    reasons.push(`Retrospective basis: Taxable turnover ($${annualTurnover.toLocaleString()}) exceeds $1M threshold in the past 12 months.`);
  }
  if (prospectiveRequired) {
    reasons.push(`Prospective basis: Projected turnover ($${projectedTurnover!.toLocaleString()}) is expected to exceed $1M in the next 12 months.`);
  }
  if (!registrationRequired) {
    reasons.push("Taxable turnover does not exceed the $1M threshold on either a retrospective or prospective basis.");
  }

  return {
    input: { annual_turnover: annualTurnover, projected_turnover: projectedTurnover },
    registration_required: registrationRequired,
    threshold: GST_REGISTRATION_THRESHOLD,
    threshold_formatted: "$1,000,000",
    retrospective_test: {
      description: "Taxable turnover at the end of the calendar year (or any 12-month period) exceeds $1M",
      turnover: annualTurnover,
      exceeds_threshold: retrospectiveRequired,
    },
    prospective_test: projectedTurnover !== null ? {
      description: "Taxable turnover in the next 12 months is expected to exceed $1M",
      projected_turnover: projectedTurnover,
      exceeds_threshold: prospectiveRequired,
    } : null,
    reasons,
    penalty_info: {
      late_registration: "Failure to register on time is an offence. IRAS may impose penalties including backdating the effective date of registration and requiring GST payment on taxable supplies made from that date.",
      fine: "Fine up to $10,000 and/or imprisonment up to 7 years for wilful failure to register.",
      deadline: "You must apply for GST registration within 30 days of the date you become liable.",
    },
    voluntary_registration: !registrationRequired ? {
      eligible: true,
      note: "Businesses below the $1M threshold may voluntarily register for GST. Must remain registered for at least 2 years and comply with all GST obligations.",
      benefits: ["Claim input tax on business purchases", "Appear more established to business customers"],
    } : null,
    summary: registrationRequired
      ? `GST registration is COMPULSORY. ${reasons.join(" ")}`
      : `GST registration is NOT compulsory (turnover below $1M threshold). Voluntary registration is available.`,
  };
}

function getGstRates(args: Record<string, unknown>) {
  const dateStr = args.date as string | undefined;

  let applicableRate: GstRateHistoryEntry | null = null;
  if (dateStr) {
    applicableRate = findGstRateForDate(dateStr);
  }

  return {
    current_rate: {
      rate_percent: 9,
      rate_decimal: 0.09,
      effective_from: "1 Jan 2024",
      note: "Second step of the planned increase from 7% to 9% (via 8% in 2023).",
    },
    queried_date: dateStr || null,
    rate_for_date: applicableRate ? {
      date: dateStr,
      rate_percent: applicableRate.rate_percent,
      rate_decimal: applicableRate.rate_decimal,
      period: applicableRate.period,
    } : dateStr ? { date: dateStr, error: "No GST rate found for this date. GST was introduced on 1 Apr 1994." } : null,
    historical_rates: GST_RATE_HISTORY.map((entry) => ({
      period: entry.period,
      rate_percent: entry.rate_percent,
    })),
    zero_rated_supplies: {
      rate_percent: 0,
      description: "Taxable supplies charged at 0% GST. Businesses can still claim input tax.",
      examples: ZERO_RATED_SUPPLIES,
    },
    exempt_supplies: {
      rate_percent: null,
      description: "Not subject to GST. Businesses cannot claim input tax on purchases used to make exempt supplies.",
      examples: EXEMPT_SUPPLIES,
    },
    summary: dateStr && applicableRate
      ? `GST rate on ${dateStr}: ${applicableRate.rate_percent}% (${applicableRate.period}). Current rate: 9% since Jan 2024.`
      : `Current Singapore GST rate: 9% (since 1 Jan 2024). Historical rates: 3% (1994), 4% (2003), 5% (2004), 7% (2007), 8% (2023), 9% (2024+).`,
  };
}

function calculateReverseCharge(args: Record<string, unknown>) {
  const amount = Number(args.amount) || 0;
  const isGstRegistered = args.is_gst_registered === true;

  if (amount < 0) {
    return { error: "Amount must be non-negative", summary: "Invalid amount provided." };
  }

  const gstPayable = isGstRegistered ? Math.round((amount * CURRENT_GST_RATE) * 100) / 100 : 0;
  const canClaimInputTax = isGstRegistered;
  const netCost = isGstRegistered
    ? amount // If registered and can claim input tax, net cost is the original amount
    : amount; // If not registered, no reverse charge applies

  return {
    input: { amount, is_gst_registered: isGstRegistered },
    gst_rate: `${CURRENT_GST_RATE * 100}%`,
    reverse_charge_applicable: isGstRegistered,
    gst_payable: gstPayable,
    can_claim_input_tax: canClaimInputTax,
    net_cost: netCost,
    explanation: isGstRegistered
      ? {
          mechanism: "Reverse charge mechanism requires GST-registered businesses importing services from overseas suppliers to account for GST as if they were the supplier.",
          output_tax: `$${gstPayable} GST must be accounted for as output tax on the imported services.`,
          input_tax: canClaimInputTax
            ? "You may claim the $" + gstPayable + " as input tax in the same GST return, subject to normal input tax claim rules (i.e., the services must be used for making taxable supplies)."
            : "Input tax cannot be claimed.",
          net_effect: canClaimInputTax
            ? "If fully claimable, the net GST cost is $0 (output tax offset by input tax claim). The net cost of the imported services remains $" + amount + "."
            : "The full $" + gstPayable + " is an additional cost.",
          filing: "Report in GST F5 return: Box 1 (Total value of standard-rated supplies) and Box 6 (Total value of taxable purchases).",
        }
      : {
          mechanism: "Reverse charge does not apply to non-GST-registered businesses.",
          note: "Non-registered businesses importing services from overseas suppliers are not required to account for GST under the reverse charge mechanism. However, the overseas supplier may be required to register for GST under the Overseas Vendor Registration (OVR) regime if supplying digital services to non-GST-registered customers in Singapore.",
        },
    effective_date: "2024-01-01",
    threshold_note: "Reverse charge applies to GST-registered businesses that are not entitled to full input tax credits and import services exceeding $1M in a 12-month period (B2B imported services).",
    summary: isGstRegistered
      ? `Reverse charge on $${amount} imported services: GST payable $${gstPayable}. Input tax claimable: Yes. Net cost: $${netCost} (assuming full input tax recovery).`
      : `Reverse charge not applicable for non-GST-registered businesses. Cost of imported services: $${amount}.`,
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS: ToolDefinition[] = [
  {
    name: "calculate_gst",
    description: "Calculate Singapore GST amount. Computes GST on a given amount, either adding GST (exclusive) or extracting GST from a GST-inclusive amount. Current rate: 9% since January 2024. Returns base amount, GST amount, and total amount. Use this tool when you need to calculate GST for invoicing, pricing, or expense analysis in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "The amount in SGD to calculate GST for." },
        inclusive: { type: "boolean", description: "If true, the amount is GST-inclusive and GST will be extracted. If false (default), GST will be added to the amount." },
      },
      required: ["amount"],
    },
  },
  {
    name: "check_gst_registration",
    description: "Check if a business must register for Singapore GST based on taxable turnover. Tests both retrospective (past 12 months > $1M) and prospective (next 12 months expected > $1M) thresholds. Returns registration requirement, penalty information, and voluntary registration options. Use this tool when advising businesses on GST registration obligations.",
    inputSchema: {
      type: "object",
      properties: {
        annual_turnover: { type: "number", description: "Taxable turnover for the past 12 months in SGD." },
        projected_turnover: { type: "number", description: "Expected taxable turnover for the next 12 months in SGD (optional)." },
      },
      required: ["annual_turnover"],
    },
  },
  {
    name: "get_gst_rates",
    description: "Get current and historical Singapore GST rates, including zero-rated and exempt supply categories. Optionally look up the applicable GST rate for a specific date. Historical rates: 3% (1994), 4% (2003), 5% (2004), 7% (2007), 8% (2023), 9% (2024+). Use this tool when you need GST rate information for compliance, historical analysis, or understanding supply classifications.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format to look up the applicable GST rate (optional). If omitted, returns current rate and full history." },
      },
    },
  },
  {
    name: "calculate_reverse_charge",
    description: "Calculate reverse charge GST on imported services from overseas suppliers. Under Singapore's reverse charge mechanism, GST-registered businesses must account for GST on imported B2B services. Returns GST payable, input tax claim eligibility, and net cost. Use this tool when a business imports services from overseas and needs to determine GST obligations.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Value of imported services in SGD." },
        is_gst_registered: { type: "boolean", description: "Whether the business is GST-registered in Singapore." },
      },
      required: ["amount", "is_gst_registered"],
    },
  },
];

// ---------------------------------------------------------------------------
// Shared MCP infrastructure (rate limiting, JSON-RPC, routing)
// ---------------------------------------------------------------------------

function buildMeta(tier: "free" | "paid", callsRemainingToday: number): ResponseMeta {
  return {
    tier,
    calls_remaining_today: callsRemainingToday,
    timestamp: new Date().toISOString(),
    source: SERVICE_NAME,
    version: SERVICE_VERSION,
    upgrade_url: UPGRADE_URL,
    pricing: {
      starter: "$29/month - 1,000 calls/month",
      pro: "$99/month - 10,000 calls/month",
      enterprise: "$299/month - unlimited calls",
    },
    related_tools: {
      "sg-regulatory-data": "https://sg-regulatory-data-mcp.sgdata.workers.dev",
      "sg-company-lookup": "https://sg-company-lookup-mcp.sgdata.workers.dev",
      "sg-cpf-calculator": "https://sg-cpf-calculator-mcp.sgdata.workers.dev",
      "asean-trade-rules": "https://asean-trade-rules-mcp.sgdata.workers.dev",
    },
    trust_score_url: `https://dominion-observatory.sgdata.workers.dev/api/trust?url=${encodeURIComponent(SELF_URL + "/mcp")}`,
    observatory: "https://dominion-observatory.sgdata.workers.dev",
    telemetry: "This server reports anonymized interaction metrics (success/fail, latency, tool name) to the Dominion Observatory for trust scoring. No query content or user data is collected.",
  };
}

function getTodayKey(ip: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `rate:${SERVICE_NAME}:${ip}:${today}`;
}

async function checkRateLimit(env: Env, ip: string): Promise<{ allowed: boolean; callsUsed: number; callsRemaining: number }> {
  try {
    const key = getTodayKey(ip);
    const raw = await env.RATE_LIMIT.get(key);
    const callsUsed = raw ? parseInt(raw, 10) : 0;
    return { allowed: callsUsed < FREE_TIER_DAILY_LIMIT, callsUsed, callsRemaining: Math.max(0, FREE_TIER_DAILY_LIMIT - callsUsed) };
  } catch {
    return { allowed: true, callsUsed: 0, callsRemaining: FREE_TIER_DAILY_LIMIT };
  }
}

async function incrementRateLimit(env: Env, ip: string): Promise<number> {
  try {
    const key = getTodayKey(ip);
    const raw = await env.RATE_LIMIT.get(key);
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;
    await env.RATE_LIMIT.put(key, String(next), { expirationTtl: 86400 });
    return Math.max(0, FREE_TIER_DAILY_LIMIT - next);
  } catch {
    return 0;
  }
}

async function validateApiKey(env: Env, key: string): Promise<boolean> {
  try {
    if (!key.startsWith("daee_sk_")) return false;
    return (await env.API_KEYS.get(key)) !== null;
  } catch {
    return false;
  }
}

function jsonRpcSuccess(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id: string | number | null, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", ...headers },
  });
}

function executeTool(toolName: string, args: Record<string, unknown>): { data: unknown; summary: string } {
  switch (toolName) {
    case "calculate_gst": { const r = calculateGst(args); return { data: r, summary: r.summary }; }
    case "check_gst_registration": { const r = checkGstRegistration(args); return { data: r, summary: r.summary }; }
    case "get_gst_rates": { const r = getGstRates(args); return { data: r, summary: r.summary }; }
    case "calculate_reverse_charge": { const r = calculateReverseCharge(args); return { data: r, summary: r.summary }; }
    default: throw new Error(`Unknown tool: ${toolName}`);
  }
}

function handleInitialize(id: string | number | null): JsonRpcResponse {
  return jsonRpcSuccess(id, {
    protocolVersion: "2024-11-05",
    capabilities: { tools: {} },
    serverInfo: { name: SERVICE_NAME, version: SERVICE_VERSION },
  });
}

function handleToolsList(id: string | number | null): JsonRpcResponse {
  return jsonRpcSuccess(id, { tools: TOOLS });
}

async function handleToolCall(id: string | number | null, params: Record<string, unknown>, env: Env, request: Request, ctx: ExecutionContext): Promise<{ response: JsonRpcResponse; status: number }> {
  const startTime = Date.now();
  const toolName = params.name as string;
  const toolArgs = (params.arguments as Record<string, unknown>) || {};

  if (!toolName) return { response: jsonRpcError(id, -32602, "Missing tool name"), status: 400 };
  if (!TOOLS.some((t) => t.name === toolName)) return { response: jsonRpcError(id, -32602, `Unknown tool: ${toolName}. Available: ${TOOLS.map((t) => t.name).join(", ")}`), status: 400 };

  const authHeader = request.headers.get("Authorization") || "";
  const apiKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";

  let tier: "free" | "paid" = "free";
  let callsRemaining = 0;

  if (apiKey && await validateApiKey(env, apiKey)) {
    tier = "paid";
    callsRemaining = -1;
  } else {
    const rateCheck = await checkRateLimit(env, clientIp);
    if (!rateCheck.allowed) {
      return { response: jsonRpcError(id, 429, "Rate limit exceeded. Free tier: 5 calls/day. Upgrade for unlimited.", { meta: buildMeta("free", 0), upgrade_url: UPGRADE_URL }), status: 429 };
    }
    await new Promise((r) => setTimeout(r, FREE_TIER_DELAY_MS));
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
// Route handlers
// ---------------------------------------------------------------------------

function handleHealth(): Response {
  return jsonResponse({ status: "ok", service: SERVICE_NAME, version: SERVICE_VERSION, timestamp: new Date().toISOString() });
}

function handleDiscovery(): Response {
  return jsonResponse({
    name: SERVICE_NAME, version: SERVICE_VERSION,
    description: "MCP server for Singapore GST calculations. Computes GST amounts (inclusive/exclusive), checks GST registration obligations, provides current and historical GST rates, and calculates reverse charge GST on imported services.",
    protocol: "mcp", protocol_version: "2024-11-05", endpoint: "/mcp",
    capabilities: { tools: TOOLS.map((t) => ({ name: t.name, description: t.description })) },
    authentication: { type: "bearer", description: "Bearer token for paid tier. Free tier: 5 calls/day with 3s delay." },
    pricing: { free: "5 calls/day with 3-second delay", starter: "$29/month - 1,000 calls/month", pro: "$99/month - 10,000 calls/month", enterprise: "$299/month - unlimited calls" },
    upgrade_url: UPGRADE_URL,
  });
}

function handleIndex(): Response {
  return jsonResponse({
    service: SERVICE_NAME, version: SERVICE_VERSION,
    description: "Singapore GST Calculator MCP Server — Calculate GST amounts, check registration requirements, look up historical rates, and compute reverse charge obligations for AI agents.",
    endpoints: { "GET /": "Info", "GET /health": "Health check", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" },
    tools: TOOLS.map((t) => t.name),
    documentation: UPGRADE_URL,
    free_tier: "5 calls/day with 3-second delay. No API key required.",
    paid_tier: "Unlimited calls, instant. Authorization: Bearer daee_sk_xxxxx",
  });
}

async function handleMcp(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: JsonRpcRequest;
  try { body = (await request.json()) as JsonRpcRequest; } catch { return jsonResponse(jsonRpcError(null, -32700, "Parse error"), 400); }
  if (body.jsonrpc !== "2.0") return jsonResponse(jsonRpcError(body.id ?? null, -32600, "jsonrpc must be '2.0'"), 400);

  const id = body.id ?? null;
  switch (body.method) {
    case "initialize": return jsonResponse(handleInitialize(id));
    case "notifications/initialized": return jsonResponse(jsonRpcSuccess(id, {}));
    case "tools/list": return jsonResponse(handleToolsList(id));
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
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" } });
      }
      const path = new URL(request.url).pathname;
      if (request.method === "GET" && path === "/health") return handleHealth();
      if (request.method === "GET" && path === "/.well-known/mcp.json") return handleDiscovery();
      if (request.method === "POST" && path === "/mcp") return await handleMcp(request, env, ctx);
      if (request.method === "GET" && path === "/") return handleIndex();
      return jsonResponse({ error: "Not found", available_endpoints: ["/", "/health", "/.well-known/mcp.json", "/mcp"] }, 404);
    } catch (error) {
      return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error), service: SERVICE_NAME, version: SERVICE_VERSION, timestamp: new Date().toISOString() }, 500);
    }
  },
};
