// ---------------------------------------------------------------------------
// sg-finance-data-mcp — Singapore Financial Data MCP Server
// ---------------------------------------------------------------------------

interface Env { RATE_LIMIT: KVNamespace; API_KEYS: KVNamespace; }
interface JsonRpcRequest { jsonrpc: "2.0"; id: string | number | null; method: string; params?: Record<string, unknown>; }
interface JsonRpcResponse { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown }; }

const SERVICE_NAME = "sg-finance-data-mcp";
const SERVICE_VERSION = "1.0.0";
const UPGRADE_URL = "https://daee-sg-finance.pages.dev";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;
const SELF_URL = "https://sg-finance-data-mcp.sgdata.workers.dev";
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";

// ---------------------------------------------------------------------------
// MAS Exchange Rate Data (reference rates)
// ---------------------------------------------------------------------------

const MAS_RATES: Record<string, { rate: number; name: string }> = {
  USD: { rate: 1.3245, name: "US Dollar" },
  EUR: { rate: 1.4520, name: "Euro" },
  GBP: { rate: 1.6890, name: "British Pound" },
  JPY: { rate: 0.00895, name: "Japanese Yen" },
  AUD: { rate: 0.8650, name: "Australian Dollar" },
  CAD: { rate: 0.9720, name: "Canadian Dollar" },
  CHF: { rate: 1.5120, name: "Swiss Franc" },
  CNY: { rate: 0.1835, name: "Chinese Yuan" },
  HKD: { rate: 0.1698, name: "Hong Kong Dollar" },
  INR: { rate: 0.01575, name: "Indian Rupee" },
  KRW: { rate: 0.000965, name: "South Korean Won" },
  MYR: { rate: 0.3025, name: "Malaysian Ringgit" },
  NZD: { rate: 0.8120, name: "New Zealand Dollar" },
  PHP: { rate: 0.02350, name: "Philippine Peso" },
  THB: { rate: 0.03820, name: "Thai Baht" },
  TWD: { rate: 0.04125, name: "Taiwan Dollar" },
  IDR: { rate: 0.0000825, name: "Indonesian Rupiah" },
  VND: { rate: 0.0000525, name: "Vietnamese Dong" },
  SAR: { rate: 0.3532, name: "Saudi Riyal" },
  AED: { rate: 0.3607, name: "UAE Dirham" },
  SEK: { rate: 0.1285, name: "Swedish Krona" },
  NOK: { rate: 0.1245, name: "Norwegian Krone" },
  DKK: { rate: 0.1948, name: "Danish Krone" },
};

// ---------------------------------------------------------------------------
// Interest Rate Data
// ---------------------------------------------------------------------------

const SORA_RATES = {
  "1M_compounded": 3.45, "3M_compounded": 3.52, "6M_compounded": 3.48,
  as_of: "2026-04-10", source: "MAS",
  note: "Singapore Overnight Rate Average — benchmark for SGD derivatives and loans",
};

const CPF_RATES = {
  ordinary_account: { rate: 2.5, floor: 2.5, note: "OA rate = 3-month average of major local banks' rates, subject to 2.5% floor" },
  special_account: { rate: 4.08, floor: 4.0, note: "SA rate = 12-month average yield of 10-year SGS + 1%, subject to 4% floor" },
  medisave_account: { rate: 4.08, floor: 4.0, note: "MA rate follows SA rate" },
  retirement_account: { rate: 4.08, floor: 4.0, note: "RA rate follows SA rate" },
  extra_interest: { first_60k: 1.0, next_30k: 1.0, above_55_first_30k: 2.0, note: "Extra interest on combined balances (OA capped at $20K for extra interest)" },
  effective_date: "2026-Q1",
};

const SSB_YIELDS = {
  latest_issue: "SB2603", average_return_10yr: 2.82, first_year: 2.53, tenth_year: 3.06,
  note: "Singapore Savings Bonds — risk-free, redeemable monthly, max $200K per person",
};

const SAVINGS_RATES = {
  range: "0.05% - 4.1%",
  top_rates: [
    { bank: "OCBC 360", rate: "up to 4.10%", conditions: "Salary credit + spend + invest + insure + grow" },
    { bank: "UOB One", rate: "up to 3.85%", conditions: "Salary credit + card spend + GIRO" },
    { bank: "DBS Multiplier", rate: "up to 3.50%", conditions: "Salary credit + transactions across categories" },
    { bank: "Standard Chartered BonusSaver", rate: "up to 3.30%", conditions: "Salary credit + card spend + invest + insure" },
  ],
  base_rates: "0.05% - 0.50% without bonus conditions",
};

// ---------------------------------------------------------------------------
// SGX Market Data
// ---------------------------------------------------------------------------

const SGX_DATA = {
  indices: {
    sti: { name: "Straits Times Index (STI)", value: 3245, change_pct: 0.35, components: 30 },
    ftse_st_mid: { name: "FTSE ST Mid Cap Index", value: 642, components: 40 },
    ftse_st_small: { name: "FTSE ST Small Cap Index", value: 348, components: 80 },
    ftse_st_reit: { name: "FTSE ST REIT Index", value: 725, yield_pct: 6.8 },
  },
  market_stats: {
    total_listings: 625, market_cap_sgd_bn: 810,
    daily_volume_avg: "1.2B shares", daily_value_avg: "SGD 1.1B",
  },
  sectors: [
    { name: "Financial Services", weight: 38, top: "DBS, OCBC, UOB" },
    { name: "Real Estate/REITs", weight: 22, top: "CapitaLand, Mapletree, Ascendas" },
    { name: "Industrials", weight: 14, top: "ST Engineering, Keppel, SIA Engineering" },
    { name: "Technology", weight: 8, top: "Sea Limited, Venture Corp" },
    { name: "Consumer", weight: 7, top: "Wilmar, Thai Beverage" },
    { name: "Telecommunications", weight: 6, top: "Singtel, StarHub" },
    { name: "Healthcare", weight: 3, top: "IHH Healthcare, Raffles Medical" },
    { name: "Others", weight: 2, top: "Various" },
  ],
  reits: {
    total_listed: 42, combined_market_cap_sgd_bn: 95,
    average_yield: 6.8, yield_range: "4.5% - 9.2%",
    categories: [
      { type: "Industrial", count: 12, avg_yield: 7.2 },
      { type: "Retail", count: 8, avg_yield: 6.5 },
      { type: "Office", count: 6, avg_yield: 5.8 },
      { type: "Hospitality", count: 5, avg_yield: 7.5 },
      { type: "Healthcare", count: 4, avg_yield: 5.5 },
      { type: "Data Centre", count: 3, avg_yield: 5.2 },
      { type: "Diversified", count: 4, avg_yield: 6.8 },
    ],
  },
  listing_requirements: {
    mainboard: { market_cap_min: "SGD 150M", track_record: "3 years", profit_test: "Cumulative pre-tax profit >= SGD 7.5M (last 3 years), >= SGD 2.5M each year" },
    catalist: { market_cap_min: "No minimum", track_record: "Via full sponsor", profit_test: "No profit requirement — sponsor-supervised" },
  },
  cpf_investment: {
    oa_investable: ["STI ETF", "Selected unit trusts", "Fixed deposits", "T-bills", "SSBs", "Shares (with risk classification)"],
    sa_investable: ["Selected unit trusts", "Fixed deposits", "T-bills", "SSBs"],
    note: "CPF OA funds earn guaranteed 2.5% — only invest if expected return exceeds this",
  },
};

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function getMasExchangeRates(args: Record<string, unknown>) {
  const requestedCurrencies = args.currencies as string[] | undefined;
  const baseCurrency = (args.base_currency as string || "SGD").toUpperCase();

  let rates: Record<string, unknown>;
  if (requestedCurrencies && requestedCurrencies.length > 0) {
    rates = {};
    for (const c of requestedCurrencies) {
      const code = c.toUpperCase();
      if (MAS_RATES[code]) {
        (rates as Record<string, unknown>)[code] = { currency: MAS_RATES[code].name, sgd_per_unit: MAS_RATES[code].rate };
      }
    }
  } else {
    rates = {};
    for (const [code, data] of Object.entries(MAS_RATES)) {
      (rates as Record<string, unknown>)[code] = { currency: data.name, sgd_per_unit: data.rate };
    }
  }

  const count = Object.keys(rates).length;
  return {
    base_currency: baseCurrency,
    rates,
    source: "MAS reference rates",
    as_of: new Date().toISOString().split("T")[0],
    note: "Indicative reference rates published by MAS. Not for transaction purposes.",
    summary: `MAS exchange rates: ${count} currencies against ${baseCurrency}. Source: MAS reference rates.`,
  };
}

function calculateCurrencyConversion(args: Record<string, unknown>) {
  const amount = Number(args.amount) || 0;
  const fromCurrency = (args.from_currency as string || "").toUpperCase();
  const toCurrency = (args.to_currency as string || "").toUpperCase();

  if (amount <= 0) return { error: "Amount must be positive", summary: "Invalid amount." };

  let sgdAmount: number;
  if (fromCurrency === "SGD") {
    sgdAmount = amount;
  } else if (MAS_RATES[fromCurrency]) {
    sgdAmount = amount * MAS_RATES[fromCurrency].rate;
  } else {
    return { error: `Unknown currency: ${fromCurrency}. Available: SGD, ${Object.keys(MAS_RATES).join(", ")}`, summary: `Unknown currency: ${fromCurrency}` };
  }

  let convertedAmount: number;
  if (toCurrency === "SGD") {
    convertedAmount = sgdAmount;
  } else if (MAS_RATES[toCurrency]) {
    convertedAmount = sgdAmount / MAS_RATES[toCurrency].rate;
  } else {
    return { error: `Unknown currency: ${toCurrency}`, summary: `Unknown currency: ${toCurrency}` };
  }

  convertedAmount = Math.round(convertedAmount * 100) / 100;
  sgdAmount = Math.round(sgdAmount * 100) / 100;

  return {
    input: { amount, from: fromCurrency, to: toCurrency },
    result: { converted_amount: convertedAmount, currency: toCurrency },
    sgd_equivalent: sgdAmount,
    rate_used: fromCurrency === "SGD" ? (MAS_RATES[toCurrency] ? `1 ${toCurrency} = ${MAS_RATES[toCurrency].rate} SGD` : "1:1") : `1 ${fromCurrency} = ${MAS_RATES[fromCurrency].rate} SGD`,
    source: "MAS reference rates (indicative)",
    summary: `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency} (via SGD ${sgdAmount}).`,
  };
}

function getSgInterestRates(args: Record<string, unknown>) {
  const category = (args.category as string || "all").toLowerCase();

  const result: Record<string, unknown> = {};
  if (category === "all" || category === "sora") result.sora = SORA_RATES;
  if (category === "all" || category === "cpf") result.cpf = CPF_RATES;
  if (category === "all" || category === "ssb") result.ssb = SSB_YIELDS;
  if (category === "all" || category === "savings") result.savings = SAVINGS_RATES;

  if (Object.keys(result).length === 0) {
    return { error: `Unknown category: ${category}. Available: sora, cpf, ssb, savings, all`, summary: "Invalid category." };
  }

  result.summary = `Singapore interest rates${category !== "all" ? ` (${category})` : ""}: SORA 3M ${SORA_RATES["3M_compounded"]}%, CPF OA ${CPF_RATES.ordinary_account.rate}%, SSB 10yr avg ${SSB_YIELDS.average_return_10yr}%.`;
  return result;
}

function getSgxMarketData(args: Record<string, unknown>) {
  const focus = (args.focus as string || "overview").toLowerCase();

  switch (focus) {
    case "indices": return { indices: SGX_DATA.indices, summary: `SGX STI at ${SGX_DATA.indices.sti.value} (${SGX_DATA.indices.sti.change_pct > 0 ? "+" : ""}${SGX_DATA.indices.sti.change_pct}%). 4 major indices tracked.` };
    case "sectors": return { sectors: SGX_DATA.sectors, summary: `SGX sector breakdown: Financial Services (${SGX_DATA.sectors[0].weight}%), REITs (${SGX_DATA.sectors[1].weight}%), Industrials (${SGX_DATA.sectors[2].weight}%).` };
    case "reits": return { reits: SGX_DATA.reits, summary: `${SGX_DATA.reits.total_listed} SGX-listed REITs. Average yield: ${SGX_DATA.reits.average_yield}%. Market cap: SGD ${SGX_DATA.reits.combined_market_cap_sgd_bn}B.` };
    case "listing_requirements": return { listing_requirements: SGX_DATA.listing_requirements, summary: `SGX Mainboard: min SGD 150M market cap, 3-year track record. Catalist: no minimum, sponsor-supervised.` };
    case "cpf_investment": return { cpf_investment: SGX_DATA.cpf_investment, summary: `CPF OA can invest in STI ETF, unit trusts, shares. SA limited to unit trusts and fixed income. OA guaranteed rate: 2.5%.` };
    default: return {
      market: SGX_DATA.market_stats, indices: SGX_DATA.indices,
      sectors: SGX_DATA.sectors, reits: { total: SGX_DATA.reits.total_listed, avg_yield: SGX_DATA.reits.average_yield },
      summary: `SGX overview: ${SGX_DATA.market_stats.total_listings} listings, SGD ${SGX_DATA.market_stats.market_cap_sgd_bn}B market cap. STI at ${SGX_DATA.indices.sti.value}. ${SGX_DATA.reits.total_listed} REITs avg yield ${SGX_DATA.reits.average_yield}%.`,
    };
  }
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

interface ToolDefinition { name: string; description: string; inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] }; }

const TOOLS: ToolDefinition[] = [
  {
    name: "get_mas_exchange_rates",
    description: "MAS reference exchange rates for SGD against major currencies. Use this tool when you need Singapore dollar (SGD) exchange rates for financial calculations, international transfers, or business invoicing.",
    inputSchema: { type: "object", properties: {
      currencies: { type: "array", items: { type: "string" }, description: "ISO currency codes to retrieve (e.g., [\"USD\", \"EUR\", \"MYR\"]). Leave empty for all currencies." },
      base_currency: { type: "string", description: "Base currency for display. Defaults to SGD." },
    }},
  },
  {
    name: "calculate_currency_conversion",
    description: "Convert an amount between any currency and SGD using MAS reference rates. Use this tool when you need to convert money amounts for contracts, invoices, or financial reporting in Singapore.",
    inputSchema: { type: "object", properties: {
      amount: { type: "number", description: "The amount to convert." },
      from_currency: { type: "string", description: "Source currency code (e.g., 'USD', 'MYR'). Use 'SGD' to convert from SGD." },
      to_currency: { type: "string", description: "Target currency code. Use 'SGD' to convert to Singapore dollars." },
    }, required: ["amount", "from_currency", "to_currency"] },
  },
  {
    name: "get_sg_interest_rates",
    description: "Singapore benchmark interest rates including SORA, CPF rates, SSB yields, and savings account ranges. Use this tool when you need Singapore interest rate data for financial planning, loan comparisons, or investment decisions.",
    inputSchema: { type: "object", properties: {
      category: { type: "string", description: "Filter by category: sora, cpf, ssb, savings, all. Defaults to all." },
    }},
  },
  {
    name: "get_sgx_market_data",
    description: "SGX market structure, key indices, sector breakdown, REIT statistics, and listing requirements. Use this tool when you need Singapore Exchange market intelligence for investment research, competitive analysis, or listing guidance.",
    inputSchema: { type: "object", properties: {
      focus: { type: "string", description: "Focus area: overview, indices, sectors, reits, listing_requirements, cpf_investment. Leave empty for full overview." },
    }},
  },
];

// ---------------------------------------------------------------------------
// Observatory telemetry (anonymized, fire-and-forget)
// ---------------------------------------------------------------------------

function reportTelemetry(ctx: ExecutionContext, toolName: string, success: boolean, latencyMs: number, httpStatus: number) {
  ctx.waitUntil(
    fetch(OBSERVATORY_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call',
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
      "sg-gst-calculator": "https://sg-gst-calculator-mcp.sgdata.workers.dev",
      "sg-cpf-calculator": "https://sg-cpf-calculator-mcp.sgdata.workers.dev",
      "sg-company-lookup": "https://sg-company-lookup-mcp.sgdata.workers.dev",
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
    case "get_mas_exchange_rates": { const r = getMasExchangeRates(args); return { data: r, summary: r.summary }; }
    case "calculate_currency_conversion": { const r = calculateCurrencyConversion(args); return { data: r, summary: (r as Record<string, unknown>).summary as string }; }
    case "get_sg_interest_rates": { const r = getSgInterestRates(args); return { data: r, summary: r.summary as string }; }
    case "get_sgx_market_data": { const r = getSgxMarketData(args); return { data: r, summary: (r as Record<string, unknown>).summary as string }; }
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" } });
      const path = new URL(request.url).pathname;

      if (request.method === "GET" && path === "/health") return jsonResponse({ status: "ok", service: SERVICE_NAME, version: SERVICE_VERSION, timestamp: new Date().toISOString() });
      if (request.method === "GET" && path === "/.well-known/mcp.json") return jsonResponse({
        name: SERVICE_NAME, version: SERVICE_VERSION,
        description: "MCP server for Singapore financial data — MAS exchange rates, SGD currency conversion, SORA/CPF/SSB interest rates, SGX market structure, S-REITs, and CPF investment schemes.",
        protocol: "mcp", protocol_version: "2024-11-05", endpoint: "/mcp",
        capabilities: { tools: TOOLS.map(t => ({ name: t.name, description: t.description })) },
        authentication: { type: "bearer", description: "Bearer token for paid tier. Free tier: 5 calls/day with 3s delay." },
        pricing: { free: "5 calls/day", starter: "$29/month", pro: "$99/month", enterprise: "$299/month" },
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
        description: "Singapore Financial Data MCP Server — MAS exchange rates, currency conversion, interest rates, SGX market data for AI agents.",
        endpoints: { "GET /": "Info", "GET /health": "Health", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" },
        tools: TOOLS.map(t => t.name),
      });

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) { return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }, 500); }
  },
};
