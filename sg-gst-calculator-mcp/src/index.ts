// ---------------------------------------------------------------------------
// sg-gst-calculator-mcp — Singapore GST Calculator MCP Server
// ---------------------------------------------------------------------------

interface Env { RATE_LIMIT: KVNamespace; API_KEYS: KVNamespace; }
interface JsonRpcRequest { jsonrpc: "2.0"; id: string | number | null; method: string; params?: Record<string, unknown>; }
interface JsonRpcResponse { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown }; }

const SERVICE_NAME = "sg-gst-calculator-mcp";
const SERVICE_VERSION = "1.0.0";
const UPGRADE_URL = "https://daee-sg-gst.pages.dev";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;
const SELF_URL = "https://sg-gst-calculator-mcp.sgdata.workers.dev";
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";

const CURRENT_GST_RATE = 9;

// ---------------------------------------------------------------------------
// GST Rate History
// ---------------------------------------------------------------------------

const GST_HISTORY = [
  { rate: 3, from: "1994-04-01", to: "2003-12-31", label: "3% (1994-2003)" },
  { rate: 4, from: "2004-01-01", to: "2004-12-31", label: "4% (2004)" },
  { rate: 5, from: "2005-01-01", to: "2007-06-30", label: "5% (2005-Jul 2007)" },
  { rate: 7, from: "2007-07-01", to: "2022-12-31", label: "7% (Jul 2007-2022)" },
  { rate: 8, from: "2023-01-01", to: "2023-12-31", label: "8% (2023)" },
  { rate: 9, from: "2024-01-01", to: null, label: "9% (Jan 2024-present)" },
];

const EXEMPT_SUPPLIES = [
  "Sale and lease of residential property",
  "Financial services (lending, deposit-taking, insurance, securities dealing)",
  "Digital payment tokens (effective Jan 2020)",
  "Investment precious metals (gold, silver, platinum bars/coins meeting purity standards)",
];

const ZERO_RATED_SUPPLIES = [
  "Export of goods",
  "International services (services supplied to overseas persons and consumed outside Singapore)",
  "Supply of goods within or between Free Trade Zones",
];

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function calculateGst(args: Record<string, unknown>) {
  const amount = Number(args.amount) || 0;
  const gstInclusive = Boolean(args.gst_inclusive);
  const rate = Number(args.custom_rate) || CURRENT_GST_RATE;
  const rateFraction = rate / 100;

  if (amount <= 0) return { error: "Amount must be positive", summary: "Invalid amount." };

  let gstAmount: number, baseAmount: number, totalAmount: number;

  if (gstInclusive) {
    gstAmount = Math.round((amount * rateFraction / (1 + rateFraction)) * 100) / 100;
    baseAmount = Math.round((amount - gstAmount) * 100) / 100;
    totalAmount = amount;
  } else {
    gstAmount = Math.round(amount * rateFraction * 100) / 100;
    baseAmount = amount;
    totalAmount = Math.round((amount + gstAmount) * 100) / 100;
  }

  return {
    input: { amount, gst_inclusive: gstInclusive, rate: `${rate}%` },
    calculation: {
      base_amount: baseAmount,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      gst_rate: `${rate}%`,
      method: gstInclusive ? "GST extracted from inclusive amount" : "GST added on top of base amount",
    },
    formula: gstInclusive
      ? `GST = ${amount} × ${rate}/${100 + rate} = $${gstAmount}`
      : `GST = ${amount} × ${rate}/100 = $${gstAmount}`,
    effective_rate: `${rate}% (since ${rate === CURRENT_GST_RATE ? "1 Jan 2024" : "custom rate"})`,
    summary: `${gstInclusive ? "Extracted" : "Calculated"} GST of $${gstAmount} (${rate}%) on $${amount}. ${gstInclusive ? `Base: $${baseAmount}` : `Total: $${totalAmount}`}.`,
  };
}

function checkGstRegistration(args: Record<string, unknown>) {
  const annualTurnover = Number(args.annual_turnover) || 0;
  const projectedTurnover = Number(args.projected_turnover) || 0;
  const considerVoluntary = Boolean(args.consider_voluntary);
  const hasOverseasRevenue = Boolean(args.has_overseas_revenue);
  const threshold = 1000000;

  const compulsoryRetrospective = annualTurnover >= threshold;
  const compulsoryProspective = projectedTurnover >= threshold;
  const compulsory = compulsoryRetrospective || compulsoryProspective;

  const result: Record<string, unknown> = {
    input: { annual_turnover: annualTurnover, projected_turnover: projectedTurnover || null },
    threshold: { amount: threshold, description: "$1,000,000 taxable turnover" },
    compulsory_registration: {
      required: compulsory,
      retrospective_test: { passed: compulsoryRetrospective, description: "Annual taxable turnover exceeds $1M in past 12 months" },
      prospective_test: { passed: compulsoryProspective, description: "Projected taxable turnover exceeds $1M in next 12 months" },
      deadline: compulsory ? "Must register within 30 days of liability arising" : null,
      penalty_for_late: compulsory ? "Fine up to $10,000 and/or imprisonment up to 7 years. GST payable from date liability arose." : null,
    },
  };

  if (considerVoluntary && !compulsory) {
    result.voluntary_registration = {
      eligible: true,
      benefits: [
        "Claim input tax credits on business purchases",
        "May enhance business credibility with larger clients",
        "Useful if selling zero-rated supplies (claim input tax, no output tax)",
      ],
      obligations: [
        "Must remain registered for at least 2 years",
        "Must file GST returns quarterly (or monthly if approved)",
        "Must charge GST on all taxable supplies",
        "Must comply with all GST record-keeping requirements",
      ],
      recommendation: annualTurnover > 500000 ? "Consider voluntary registration — approaching threshold" : "Voluntary registration optional at current turnover",
    };
  }

  if (hasOverseasRevenue) {
    result.overseas_vendor_registration = {
      applies: true,
      description: "Overseas businesses supplying digital services to non-GST-registered customers in Singapore must register for GST if annual turnover exceeds $1M and B2C digital services to Singapore exceed $100,000.",
      threshold_global: "$1,000,000 global turnover",
      threshold_sg_b2c: "$100,000 B2C digital services to Singapore",
    };
  }

  result.summary = compulsory
    ? `Compulsory GST registration REQUIRED. Annual turnover: $${annualTurnover.toLocaleString()}${compulsoryRetrospective ? " (exceeds $1M retrospective test)" : ""}.${compulsoryProspective ? " Projected turnover also exceeds threshold." : ""} Register within 30 days.`
    : `GST registration NOT required. Annual turnover $${annualTurnover.toLocaleString()} is below $1M threshold.${considerVoluntary ? " Voluntary registration available." : ""}`;

  return result;
}

function getGstRates(args: Record<string, unknown>) {
  const asOfDate = args.as_of_date as string | undefined;

  if (asOfDate) {
    const target = new Date(asOfDate);
    if (isNaN(target.getTime())) return { error: "Invalid date format. Use YYYY-MM-DD.", summary: "Invalid date." };

    const applicable = GST_HISTORY.find(h => {
      const from = new Date(h.from);
      const to = h.to ? new Date(h.to) : new Date("2099-12-31");
      return target >= from && target <= to;
    });

    return {
      query_date: asOfDate,
      applicable_rate: applicable ? `${applicable.rate}%` : "GST not yet introduced",
      period: applicable?.label || "Before GST introduction",
      current_rate: `${CURRENT_GST_RATE}%`,
      summary: applicable ? `GST rate on ${asOfDate}: ${applicable.rate}% (${applicable.label}).` : `No GST applicable on ${asOfDate}.`,
    };
  }

  return {
    current_rate: `${CURRENT_GST_RATE}%`,
    effective_since: "1 January 2024",
    history: GST_HISTORY.map(h => ({ rate: `${h.rate}%`, period: h.label })),
    exempt_supplies: EXEMPT_SUPPLIES,
    zero_rated_supplies: ZERO_RATED_SUPPLIES,
    registration_threshold: "$1,000,000 annual taxable turnover",
    filing_frequency: "Quarterly (default) or monthly (if approved)",
    summary: `Current GST rate: ${CURRENT_GST_RATE}% (since Jan 2024). ${GST_HISTORY.length} historical rate changes. ${EXEMPT_SUPPLIES.length} exempt categories, ${ZERO_RATED_SUPPLIES.length} zero-rated categories.`,
  };
}

function calculateReverseCharge(args: Record<string, unknown>) {
  const importedServicesValue = Number(args.imported_services_value) || 0;
  const totalTaxableTurnover = Number(args.total_taxable_turnover) || 0;
  const isGstRegistered = Boolean(args.is_gst_registered);

  if (importedServicesValue <= 0) return { error: "Imported services value must be positive", summary: "Invalid amount." };

  const gstPayable = Math.round(importedServicesValue * (CURRENT_GST_RATE / 100) * 100) / 100;

  const combinedTurnover = totalTaxableTurnover + importedServicesValue;
  const registrationImpact = !isGstRegistered && combinedTurnover >= 1000000;

  const inputTaxClaimable = isGstRegistered;

  return {
    input: { imported_services_value: importedServicesValue, total_taxable_turnover: totalTaxableTurnover || null, is_gst_registered: isGstRegistered },
    reverse_charge: {
      gst_rate: `${CURRENT_GST_RATE}%`,
      gst_payable: gstPayable,
      description: "Reverse charge GST applies when Singapore businesses purchase services from overseas suppliers",
      applies_to: "B2B imported services where supplier is not GST-registered in Singapore",
    },
    registration_impact: {
      combined_turnover_with_imports: combinedTurnover,
      triggers_registration: registrationImpact,
      note: registrationImpact
        ? "WARNING: Imported services push combined turnover above $1M threshold. GST registration may be required."
        : "Combined turnover remains below registration threshold.",
    },
    input_tax_credit: {
      claimable: inputTaxClaimable,
      amount: inputTaxClaimable ? gstPayable : 0,
      note: inputTaxClaimable
        ? "As a GST-registered business, you can claim the reverse charge GST as input tax credit (net cash impact: $0)."
        : "Non-GST-registered businesses cannot claim input tax credits. Full GST amount is an additional cost.",
    },
    net_cost: inputTaxClaimable ? 0 : gstPayable,
    summary: `Reverse charge GST on $${importedServicesValue} imported services: $${gstPayable} (${CURRENT_GST_RATE}%). ${inputTaxClaimable ? "Input tax credit claimable — net cost: $0." : `Net additional cost: $${gstPayable}.`}${registrationImpact ? " WARNING: May trigger GST registration." : ""}`,
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

interface ToolDefinition { name: string; description: string; inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] }; }

const TOOLS: ToolDefinition[] = [
  {
    name: "calculate_gst",
    description: "Calculate Singapore GST (Goods and Services Tax) amount for any transaction. Supports both GST-inclusive (extract GST from total) and GST-exclusive (add GST to base) calculations. Use this tool when you need to compute GST for invoicing, pricing, or accounting in Singapore.",
    inputSchema: {
      type: "object",
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
      type: "object",
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
      type: "object",
      properties: {
        as_of_date: { type: "string", description: "Date in YYYY-MM-DD format to look up the applicable GST rate. Omit for current rate and full history." },
      },
    },
  },
  {
    name: "calculate_reverse_charge",
    description: "Calculate reverse charge GST on imported services from overseas suppliers. Determines GST payable, registration impact, and input tax credit eligibility. Use this tool when you need to assess GST obligations on services purchased from foreign vendors by Singapore businesses.",
    inputSchema: {
      type: "object",
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
      "sg-company-lookup": "https://sg-company-lookup-mcp.sgdata.workers.dev",
      "sg-finance-data": "https://sg-finance-data-mcp.sgdata.workers.dev",
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

function executeTool(name: string, args: Record<string, unknown>): { data: unknown; summary: string } {
  switch (name) {
    case "calculate_gst": { const r = calculateGst(args); return { data: r, summary: (r as Record<string, unknown>).summary as string }; }
    case "check_gst_registration": { const r = checkGstRegistration(args); return { data: r, summary: r.summary as string }; }
    case "get_gst_rates": { const r = getGstRates(args); return { data: r, summary: (r as Record<string, unknown>).summary as string }; }
    case "calculate_reverse_charge": { const r = calculateReverseCharge(args); return { data: r, summary: (r as Record<string, unknown>).summary as string }; }
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
    const { data, summary } = executeTool(toolName, toolArgs);
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
        description: "MCP server for Singapore GST calculations — compute GST amounts, check registration obligations, get historical rates, and calculate reverse charge on imported services.",
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
        description: "Singapore GST Calculator MCP Server — compute GST, check registration obligations, historical rates, and reverse charge for AI agents.",
        endpoints: { "GET /": "Info", "GET /health": "Health", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" },
        tools: TOOLS.map(t => t.name),
      });

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) { return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }, 500); }
  },
};
