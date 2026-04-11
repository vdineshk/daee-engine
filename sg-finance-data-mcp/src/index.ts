// ---------------------------------------------------------------------------
// sg-finance-data-mcp — Singapore Financial Data MCP Server
// MAS exchange rates, SGX market data, SORA/interest rates, CPF investment
// ---------------------------------------------------------------------------

interface Env { RATE_LIMIT: KVNamespace; API_KEYS: KVNamespace; }
interface JsonRpcRequest { jsonrpc: "2.0"; id: string | number | null; method: string; params?: Record<string, unknown>; }
interface JsonRpcResponse { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown }; }

const SERVICE_NAME = "sg-finance-data-mcp";
const SERVICE_VERSION = "1.0.0";
const UPGRADE_URL = "https://daee-sg-finance.pages.dev";
const SELF_URL = "https://sg-finance-data-mcp.sgdata.workers.dev";
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;

// ---------------------------------------------------------------------------
// MAS Reference Exchange Rates (updated quarterly; official at mas.gov.sg)
// As of Q1 2026. Source: MAS Statistical Release
// ---------------------------------------------------------------------------

const MAS_RATES: Record<string, { rate: number; unit: string; description: string }> = {
  USD: { rate: 1.3450, unit: "SGD per 1 USD", description: "US Dollar" },
  EUR: { rate: 1.4680, unit: "SGD per 1 EUR", description: "Euro" },
  GBP: { rate: 1.7120, unit: "SGD per 1 GBP", description: "British Pound" },
  JPY: { rate: 0.00890, unit: "SGD per 1 JPY", description: "Japanese Yen" },
  CNY: { rate: 0.1850, unit: "SGD per 1 CNY", description: "Chinese Yuan Renminbi" },
  HKD: { rate: 0.1725, unit: "SGD per 1 HKD", description: "Hong Kong Dollar" },
  AUD: { rate: 0.8480, unit: "SGD per 1 AUD", description: "Australian Dollar" },
  CAD: { rate: 0.9890, unit: "SGD per 1 CAD", description: "Canadian Dollar" },
  CHF: { rate: 1.5230, unit: "SGD per 1 CHF", description: "Swiss Franc" },
  MYR: { rate: 0.2990, unit: "SGD per 1 MYR", description: "Malaysian Ringgit" },
  THB: { rate: 0.0390, unit: "SGD per 1 THB", description: "Thai Baht" },
  IDR: { rate: 0.0000820, unit: "SGD per 1 IDR", description: "Indonesian Rupiah" },
  PHP: { rate: 0.0234, unit: "SGD per 1 PHP", description: "Philippine Peso" },
  VND: { rate: 0.0000527, unit: "SGD per 1 VND", description: "Vietnamese Dong" },
  INR: { rate: 0.01558, unit: "SGD per 1 INR", description: "Indian Rupee" },
  KRW: { rate: 0.000940, unit: "SGD per 1 KRW", description: "South Korean Won" },
  NZD: { rate: 0.7760, unit: "SGD per 1 NZD", description: "New Zealand Dollar" },
};

// ---------------------------------------------------------------------------
// Singapore Interest Rates (as of Q1 2026)
// ---------------------------------------------------------------------------

const SG_INTEREST_RATES = {
  sora: {
    overnight: 3.25,
    one_month_compounded: 3.31,
    three_month_compounded: 3.38,
    six_month_compounded: 3.42,
    description: "Singapore Overnight Rate Average — benchmark rate replacing SIBOR. Published daily by MAS.",
    source: "MAS (mas.gov.sg/statistics/interest-rates)",
    effective_date: "2026-01-01",
  },
  cpf_rates: {
    ordinary_account: 2.5,
    special_account: 4.0,
    medisave_account: 4.0,
    retirement_account: 4.0,
    extra_interest: {
      first_60k_combined: 1.0,
      note: "Extra 1% p.a. interest on first SGD 60,000 combined CPF balances (OA capped at SGD 20,000)",
    },
    description: "CPF base interest rates set by CPF Board",
  },
  ssb: {
    current_issue_10yr_avg: 2.87,
    max_investment_per_issue: 200000,
    total_holdings_cap: 200000,
    description: "Singapore Savings Bonds — SGS-linked, capital-guaranteed government savings bonds",
    source: "MAS/CPF Board",
  },
  savings_accounts: {
    note: "Major banks (DBS, OCBC, UOB) offer 3.0-4.5% p.a. on eligible savings accounts with salary crediting.",
  },
  fixed_deposits: {
    typical_range_12m: "2.8% - 3.5% p.a. for 12-month SGD fixed deposits (major banks, Q1 2026)",
  },
};

// ---------------------------------------------------------------------------
// SGX Market Structure
// ---------------------------------------------------------------------------

const SGX_MARKET = {
  overview: {
    exchange: "Singapore Exchange (SGX)",
    main_board_companies: 470,
    catalist_companies: 160,
    total_market_cap_sgd_bn: 920,
    source: "SGX Market Statistics Q4 2025",
    trading_hours: {
      morning_session: "09:00 - 12:00 SGT (UTC+8)",
      afternoon_session: "13:00 - 17:00 SGT",
      pre_market: "08:30 - 09:00 SGT",
      note: "T+2 settlement for securities",
    },
  },
  key_indices: [
    { name: "STI (Straits Times Index)", description: "Top 30 companies by market cap on SGX Main Board", benchmark: true },
    { name: "FTSE ST All-Share Index", description: "All SGX Main Board and Catalist stocks", benchmark: false },
    { name: "FTSE ST Mid Cap Index", description: "Mid-cap Singapore stocks", benchmark: false },
    { name: "FTSE ST Small Cap Index", description: "Small-cap Singapore stocks", benchmark: false },
    { name: "MSCI Singapore Index", description: "International benchmark for Singapore large/mid caps", benchmark: true },
  ],
  sector_breakdown: [
    { sector: "Financial Services", weight_pct: 42.1, key_companies: ["DBS", "OCBC", "UOB"] },
    { sector: "Real Estate (REITs + Developers)", weight_pct: 23.8, key_companies: ["CapitaLand", "Mapletree"] },
    { sector: "Industrials & Logistics", weight_pct: 12.4, key_companies: ["ST Engineering", "SIA"] },
    { sector: "Consumer", weight_pct: 8.2, key_companies: ["Sheng Siong", "Dairy Farm"] },
    { sector: "Healthcare", weight_pct: 5.1, key_companies: ["IHH Healthcare", "Raffles Medical"] },
    { sector: "Technology & Communications", weight_pct: 4.7, key_companies: ["Singtel", "Venture Corp"] },
    { sector: "Others", weight_pct: 3.7, key_companies: [] },
  ],
  reits: {
    total_s_reits_and_property_trusts: 42,
    total_aum_sgd_bn: 108,
    average_yield_pct: 5.8,
    note: "Singapore REITs (S-REITs) distribute 90%+ of taxable income. No withholding tax for individual investors.",
    top_by_market_cap: ["CapitaLand Integrated Commercial Trust", "Mapletree Pan Asia Commercial Trust", "Frasers Logistics & Commercial Trust"],
  },
  listing_requirements: {
    main_board: {
      min_market_cap_sgd_m: 150,
      min_operating_track_record_years: 3,
      min_shareholders: 500,
    },
    catalist: {
      note: "Sponsor-supervised board. No minimum market cap or track record. Suitable for smaller growth companies.",
    },
  },
};

// ---------------------------------------------------------------------------
// CPF Investment Schemes
// ---------------------------------------------------------------------------

const CPF_INVESTMENT = {
  cpfis_oa: {
    name: "CPF Investment Scheme — Ordinary Account (CPFIS-OA)",
    investable_amount: "Up to 35% of investable savings in stocks; up to 10% in gold",
    eligible_investments: [
      "Unit trusts (selected)",
      "Investment-linked policies",
      "Annuities",
      "Singapore Government Securities",
      "Bonds (selected)",
      "Exchange Traded Funds (ETFs) on SGX",
      "Shares of SGX-listed companies",
    ],
    excluded: "First SGD 20,000 of OA balance cannot be invested",
    note: "OA interest rate is 2.5% p.a. Investments must outperform 2.5% to be worthwhile.",
  },
  cpfis_sa: {
    name: "CPF Investment Scheme — Special Account (CPFIS-SA)",
    eligible_investments: [
      "Selected unit trusts",
      "Investment-linked policies",
      "Annuities",
    ],
    note: "SA interest rate is 4.0% p.a. Very few investments beat this consistently. Most financial advisors suggest leaving SA invested in CPF.",
  },
  supplementary_retirement_scheme: {
    name: "Supplementary Retirement Scheme (SRS)",
    annual_contribution_cap: {
      singapore_citizen_pr: 15300,
      foreigner: 35700,
    },
    tax_relief: "Contributions qualify for income tax relief",
    eligible_investments: ["SGX stocks", "Unit trusts", "ETFs", "Fixed deposits", "SSBs"],
    withdrawal_at_retirement: "50% of withdrawals taxable after statutory retirement age (63)",
  },
};

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "get_mas_exchange_rates",
    description: "MAS reference exchange rates for SGD against major currencies. Use this tool when you need Singapore dollar (SGD) exchange rates for financial calculations, international transfers, or business invoicing.",
    inputSchema: {
      type: "object" as const,
      properties: {
        currencies: {
          type: "array",
          items: { type: "string" },
          description: "ISO currency codes to retrieve (e.g., [\"USD\", \"EUR\", \"MYR\"]). Leave empty for all currencies.",
        },
        base_currency: {
          type: "string",
          description: "Base currency for conversion display. Defaults to SGD.",
        },
      },
    },
  },
  {
    name: "calculate_currency_conversion",
    description: "Convert an amount between any currency and SGD using MAS reference rates. Use this tool when you need to convert money amounts for contracts, invoices, or financial reporting in Singapore.",
    inputSchema: {
      type: "object" as const,
      properties: {
        amount: { type: "number", description: "The amount to convert." },
        from_currency: { type: "string", description: "Source currency code (e.g., 'USD', 'MYR'). Use 'SGD' to convert from SGD to another currency." },
        to_currency: { type: "string", description: "Target currency code. Use 'SGD' to convert to Singapore dollars." },
      },
      required: ["amount", "from_currency", "to_currency"],
    },
  },
  {
    name: "get_sg_interest_rates",
    description: "Singapore benchmark interest rates including SORA, CPF rates, SSB yields, and savings account ranges. Use this tool when you need Singapore interest rate data for financial planning, loan comparisons, or investment decisions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description: "Filter by category: sora, cpf, ssb, savings, all. Defaults to all.",
        },
      },
    },
  },
  {
    name: "get_sgx_market_data",
    description: "SGX market structure, key indices, sector breakdown, REIT statistics, and listing requirements. Use this tool when you need Singapore Exchange market intelligence for investment research, competitive analysis, or listing guidance.",
    inputSchema: {
      type: "object" as const,
      properties: {
        focus: {
          type: "string",
          description: "Focus area: overview, indices, sectors, reits, listing_requirements, cpf_investment. Leave empty for full overview.",
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool Execution
// ---------------------------------------------------------------------------

function toolGetMasExchangeRates(args: Record<string, unknown>): { data: unknown; summary: string } {
  const requestedCurrencies = args.currencies as string[] | undefined;
  const baseCurrency = (args.base_currency as string || "SGD").toUpperCase();

  let rates: Record<string, unknown>;

  if (requestedCurrencies && requestedCurrencies.length > 0) {
    const filtered: Record<string, unknown> = {};
    const missing: string[] = [];
    for (const c of requestedCurrencies.map(c => c.toUpperCase())) {
      if (MAS_RATES[c]) {
        filtered[c] = MAS_RATES[c];
      } else if (c !== "SGD") {
        missing.push(c);
      }
    }
    rates = filtered;
    if (missing.length > 0) {
      return {
        data: {
          base_currency: baseCurrency,
          rates: filtered,
          missing_currencies: missing,
          available_currencies: Object.keys(MAS_RATES),
          data_as_of: "Q1 2026",
          source: "MAS Statistical Release (reference rates)",
          official_source: "https://eservices.mas.gov.sg/statistics/msb",
        },
        summary: `Partial results: ${Object.keys(filtered).length} found, ${missing.length} not found (${missing.join(", ")}).`,
      };
    }
  } else {
    rates = MAS_RATES as Record<string, unknown>;
  }

  return {
    data: {
      base_currency: baseCurrency,
      rates,
      currency_count: Object.keys(rates).length,
      data_as_of: "Q1 2026",
      source: "MAS Statistical Release (reference rates)",
      official_source: "https://eservices.mas.gov.sg/statistics/msb",
      note: "These are MAS reference rates for financial reporting. Actual transaction rates from banks/money changers may differ. For real-time rates, use MAS API: https://eservices.mas.gov.sg/api/action/datastore/search.json",
    },
    summary: `MAS SGD exchange rates for ${Object.keys(rates).length} currencies as of Q1 2026. 1 USD = ${MAS_RATES.USD.rate} SGD, 1 EUR = ${MAS_RATES.EUR.rate} SGD.`,
  };
}

function toolCalculateCurrencyConversion(args: Record<string, unknown>): { data: unknown; summary: string } {
  const amount = args.amount as number;
  const fromCurrency = (args.from_currency as string || "").toUpperCase();
  const toCurrency = (args.to_currency as string || "").toUpperCase();

  if (!amount || amount <= 0) throw new Error("amount must be a positive number");
  if (!fromCurrency) throw new Error("from_currency is required");
  if (!toCurrency) throw new Error("to_currency is required");

  let sgdAmount: number;
  let fromRate: number;

  if (fromCurrency === "SGD") {
    sgdAmount = amount;
    fromRate = 1;
  } else if (MAS_RATES[fromCurrency]) {
    fromRate = MAS_RATES[fromCurrency].rate;
    sgdAmount = amount * fromRate;
  } else {
    throw new Error(`Currency ${fromCurrency} not found. Available: SGD, ${Object.keys(MAS_RATES).join(", ")}`);
  }

  let convertedAmount: number;
  let toRate: number;

  if (toCurrency === "SGD") {
    convertedAmount = sgdAmount;
    toRate = 1;
  } else if (MAS_RATES[toCurrency]) {
    toRate = MAS_RATES[toCurrency].rate;
    convertedAmount = sgdAmount / toRate;
  } else {
    throw new Error(`Currency ${toCurrency} not found. Available: SGD, ${Object.keys(MAS_RATES).join(", ")}`);
  }

  const roundedAmount = Math.round(convertedAmount * 10000) / 10000;

  return {
    data: {
      from: { amount, currency: fromCurrency },
      to: { amount: roundedAmount, currency: toCurrency },
      via_sgd: fromCurrency !== "SGD" && toCurrency !== "SGD" ? Math.round(sgdAmount * 10000) / 10000 : undefined,
      rates_used: {
        [`${fromCurrency}_to_SGD`]: fromCurrency === "SGD" ? 1 : fromRate,
        [`SGD_to_${toCurrency}`]: toCurrency === "SGD" ? 1 : (1 / toRate),
      },
      effective_cross_rate: Math.round((roundedAmount / amount) * 1000000) / 1000000,
      data_as_of: "Q1 2026",
      note: "Based on MAS reference rates. Actual bank/money changer rates include spread.",
    },
    summary: `${amount.toLocaleString()} ${fromCurrency} = ${roundedAmount.toLocaleString()} ${toCurrency} (MAS reference rate, Q1 2026).`,
  };
}

function toolGetSgInterestRates(args: Record<string, unknown>): { data: unknown; summary: string } {
  const category = (args.category as string || "all").toLowerCase();

  let data: Record<string, unknown> = {};

  if (category === "sora" || category === "all") {
    data.sora = SG_INTEREST_RATES.sora;
  }
  if (category === "cpf" || category === "all") {
    data.cpf_rates = SG_INTEREST_RATES.cpf_rates;
  }
  if (category === "ssb" || category === "all") {
    data.ssb = SG_INTEREST_RATES.ssb;
  }
  if (category === "savings" || category === "all") {
    data.savings_accounts = SG_INTEREST_RATES.savings_accounts;
    data.fixed_deposits = SG_INTEREST_RATES.fixed_deposits;
  }

  if (Object.keys(data).length === 0) {
    throw new Error(`Unknown category: ${category}. Available: sora, cpf, ssb, savings, all`);
  }

  return {
    data: {
      ...data,
      data_as_of: "Q1 2026",
      source: "MAS, CPF Board",
      official_sources: {
        sora: "https://eservices.mas.gov.sg/statistics/msb/overview.html",
        cpf: "https://www.cpf.gov.sg/member/growing-your-savings/earning-higher-returns/cpf-interest-rates",
        ssb: "https://www.mas.gov.sg/bonds-and-bills/singapore-savings-bonds",
      },
    },
    summary: `Singapore interest rates (Q1 2026): SORA overnight ${SG_INTEREST_RATES.sora.overnight}%, CPF OA ${SG_INTEREST_RATES.cpf_rates.ordinary_account}%, CPF SA ${SG_INTEREST_RATES.cpf_rates.special_account}%.`,
  };
}

function toolGetSgxMarketData(args: Record<string, unknown>): { data: unknown; summary: string } {
  const focus = (args.focus as string || "overview").toLowerCase();

  switch (focus) {
    case "indices":
      return { data: { indices: SGX_MARKET.key_indices, source: "SGX" }, summary: `SGX has ${SGX_MARKET.key_indices.length} key indices. STI (Top 30) is the main benchmark.` };
    case "sectors":
      return { data: { sector_breakdown: SGX_MARKET.sector_breakdown, source: "SGX Market Stats Q4 2025" }, summary: `SGX top sector: Financial Services (${SGX_MARKET.sector_breakdown[0].weight_pct}%). ${SGX_MARKET.sector_breakdown.length} sectors tracked.` };
    case "reits":
      return { data: { s_reits: SGX_MARKET.reits }, summary: `Singapore REITs: ${SGX_MARKET.reits.total_s_reits_and_property_trusts} S-REITs with SGD ${SGX_MARKET.reits.total_aum_sgd_bn}B AUM. Average yield ${SGX_MARKET.reits.average_yield_pct}% p.a.` };
    case "listing_requirements":
      return { data: { listing: SGX_MARKET.listing_requirements }, summary: `SGX Main Board: min SGD ${SGX_MARKET.listing_requirements.main_board.min_market_cap_sgd_m}M market cap, 3yr track record. Catalist: sponsor-supervised, no minimum.` };
    case "cpf_investment":
      return { data: { cpf_investment: CPF_INVESTMENT }, summary: `CPFIS-OA: invest OA funds in SGX stocks/ETFs (35% cap). CPFIS-SA: limited options (4% CPF rate is high bar). SRS: SGD 15,300/year tax relief.` };
    default:
      return {
        data: {
          overview: SGX_MARKET.overview,
          key_indices: SGX_MARKET.key_indices,
          sector_highlights: SGX_MARKET.sector_breakdown.slice(0, 3),
          reits_summary: { total: SGX_MARKET.reits.total_s_reits_and_property_trusts, avg_yield: SGX_MARKET.reits.average_yield_pct },
          cpf_investment_summary: { cpfis_oa_max: "35% of investable OA savings", srs_annual_cap: CPF_INVESTMENT.supplementary_retirement_scheme.annual_contribution_cap },
        },
        summary: `SGX: ${SGX_MARKET.overview.main_board_companies} Main Board + ${SGX_MARKET.overview.catalist_companies} Catalist companies. Market cap SGD ${SGX_MARKET.overview.total_market_cap_sgd_bn}B. ${SGX_MARKET.reits.total_s_reits_and_property_trusts} S-REITs at ${SGX_MARKET.reits.average_yield_pct}% avg yield.`,
      };
  }
}

function executeTool(name: string, args: Record<string, unknown>): { data: unknown; summary: string } {
  switch (name) {
    case "get_mas_exchange_rates": return toolGetMasExchangeRates(args);
    case "calculate_currency_conversion": return toolCalculateCurrencyConversion(args);
    case "get_sg_interest_rates": return toolGetSgInterestRates(args);
    case "get_sgx_market_data": return toolGetSgxMarketData(args);
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
      "sg-cpf-calculator": "https://sg-cpf-calculator-mcp.sgdata.workers.dev",
      "sg-workpass-compass": "https://sg-workpass-compass-mcp.sgdata.workers.dev",
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
    const { data, summary } = executeTool(toolName, toolArgs);
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
          description: "MCP server for Singapore financial data — MAS exchange rates, SGD currency conversion, SORA/CPF/SSB interest rates, SGX market structure, S-REITs, and CPF investment schemes.",
          protocol: "mcp", protocol_version: "2024-11-05", endpoint: "/mcp",
          capabilities: { tools: TOOLS.map(t => ({ name: t.name, description: t.description })) },
          authentication: { type: "bearer", description: "Bearer token for paid tier. Free tier: 5 calls/day with 3s delay." },
          pricing: { free: "5 calls/day", starter: "$29/month", pro: "$99/month", enterprise: "$299/month" },
          upgrade_url: UPGRADE_URL,
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
          description: "Singapore Financial Data MCP Server — MAS exchange rates, currency conversion, SORA/CPF/SSB interest rates, SGX market structure, S-REITs, and CPF investment schemes for AI agents.",
          endpoints: { "GET /": "Info", "GET /health": "Health check", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" },
          tools: TOOLS.map(t => t.name),
          free_tier: "5 calls/day with 3s delay", paid_tier: "Unlimited. Authorization: Bearer daee_sk_xxxxx",
          observatory: OBSERVATORY_URL,
        });
      }

      return jsonResponse({ error: "Not found", available_endpoints: ["/", "/health", "/.well-known/mcp.json", "/mcp"] }, 404);
    } catch (error) {
      return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error), service: SERVICE_NAME, timestamp: new Date().toISOString() }, 500);
    }
  },
};
