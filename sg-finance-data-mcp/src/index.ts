// sg-finance-data-mcp — Singapore Finance Data MCP Server
// Cloudflare Worker implementing JSON-RPC 2.0 MCP protocol

interface Env {
  RATE_LIMIT: KVNamespace;
  API_KEYS: KVNamespace;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SERVICE_NAME = "sg-finance-data-mcp";
const SERVICE_VERSION = "1.1.0";
const UPGRADE_URL = "https://daee-sg-finance.pages.dev";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;

// ── Observatory Telemetry ────────────────────────────────────────────────────

const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const SELF_URL = "https://sg-finance-data-mcp.sgdata.workers.dev";

function reportTelemetry(ctx: ExecutionContext, toolName: string, success: boolean, latencyMs: number, httpStatus: number) {
  ctx.waitUntil(
    fetch(OBSERVATORY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "report_interaction",
          arguments: {
            server_url: SELF_URL + "/mcp",
            success,
            latency_ms: latencyMs,
            tool_name: toolName,
            http_status: httpStatus,
          },
        },
      }),
    }).catch(() => {})
  );
}

// ── MAS Exchange Rates (static reference, realistic 2026 values) ─────────────

const MAS_EXCHANGE_RATES: Record<string, { rate: number; name: string }> = {
  USD: { rate: 1.3185, name: "US Dollar" },
  EUR: { rate: 1.4320, name: "Euro" },
  GBP: { rate: 1.6685, name: "British Pound" },
  JPY: { rate: 0.008815, name: "Japanese Yen" },
  CNY: { rate: 0.1825, name: "Chinese Yuan" },
  AUD: { rate: 0.8640, name: "Australian Dollar" },
  HKD: { rate: 0.1692, name: "Hong Kong Dollar" },
  MYR: { rate: 0.2985, name: "Malaysian Ringgit" },
  THB: { rate: 0.03815, name: "Thai Baht" },
  IDR: { rate: 0.0000825, name: "Indonesian Rupiah" },
  PHP: { rate: 0.02325, name: "Philippine Peso" },
  VND: { rate: 0.0000528, name: "Vietnamese Dong" },
  KRW: { rate: 0.000965, name: "South Korean Won" },
  INR: { rate: 0.01568, name: "Indian Rupee" },
  TWD: { rate: 0.04095, name: "New Taiwan Dollar" },
};

// ── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "get_mas_exchange_rates",
    description:
      "Get MAS (Monetary Authority of Singapore) reference exchange rates. Returns SGD rates for 15 major currencies including USD, EUR, GBP, JPY, CNY, AUD, HKD, MYR, THB, IDR, PHP, VND, KRW, INR, and TWD.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "calculate_currency_conversion",
    description:
      "Convert an amount between a foreign currency and SGD using MAS reference rates. At least one of from_currency or to_currency must be SGD.",
    inputSchema: {
      type: "object" as const,
      properties: {
        amount: { type: "number", description: "The amount to convert" },
        from_currency: {
          type: "string",
          description: "Source currency code (e.g. USD, SGD)",
        },
        to_currency: {
          type: "string",
          description: "Target currency code (e.g. SGD, EUR)",
        },
      },
      required: ["amount", "from_currency", "to_currency"],
    },
  },
  {
    name: "get_sg_interest_rates",
    description:
      "Get current Singapore benchmark interest rates including SORA, CPF rates, SSB yields, and fixed deposit ranges.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_sgx_market_data",
    description:
      "Get SGX (Singapore Exchange) market structure data including indices, listings, market cap, sector breakdown, top S-REITs, and IPO requirements summary.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ── Build Meta ───────────────────────────────────────────────────────────────

function buildMeta(tier: string) {
  return {
    tier,
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    trust_score_url: "https://dominion-observatory.sgdata.workers.dev/trust-score?server=" + encodeURIComponent(SELF_URL + "/mcp"),
    observatory: "https://dominion-observatory.sgdata.workers.dev",
    telemetry_disclosure:
      "This MCP server reports anonymised usage telemetry (tool name, success/failure, latency, HTTP status) to the Dominion Observatory for trust scoring. No personally identifiable information is transmitted.",
    upgrade_url: UPGRADE_URL,
  };
}

// ── Tool Handlers ────────────────────────────────────────────────────────────

function handleGetMasExchangeRates() {
  const rates = Object.entries(MAS_EXCHANGE_RATES).map(([code, info]) => ({
    currency_code: code,
    currency_name: info.name,
    sgd_per_unit: info.rate,
    units_per_sgd: parseFloat((1 / info.rate).toFixed(4)),
  }));

  return {
    reference_date: "2026-04-11",
    source: "MAS Reference Rates (indicative)",
    base_currency: "SGD",
    note: "These are indicative MAS reference rates. For transaction rates, consult your bank or licensed money changer.",
    rates,
  };
}

function handleCalculateCurrencyConversion(args: {
  amount?: number;
  from_currency?: string;
  to_currency?: string;
}) {
  const { amount, from_currency, to_currency } = args;

  if (amount === undefined || !from_currency || !to_currency) {
    return {
      error: "Missing required parameters: amount, from_currency, to_currency",
    };
  }

  const from = from_currency.toUpperCase();
  const to = to_currency.toUpperCase();

  if (from !== "SGD" && to !== "SGD") {
    return {
      error:
        "At least one of from_currency or to_currency must be SGD. Cross-currency conversion is not supported.",
    };
  }

  if (from === to) {
    return {
      amount,
      from_currency: from,
      to_currency: to,
      converted_amount: amount,
      rate: 1,
      note: "Same currency — no conversion needed.",
    };
  }

  let convertedAmount: number;
  let rate: number;

  if (from === "SGD") {
    // SGD -> foreign
    const entry = MAS_EXCHANGE_RATES[to];
    if (!entry) {
      return { error: `Unsupported currency: ${to}. Supported: ${Object.keys(MAS_EXCHANGE_RATES).join(", ")}` };
    }
    rate = parseFloat((1 / entry.rate).toFixed(6));
    convertedAmount = parseFloat((amount * rate).toFixed(4));
  } else {
    // foreign -> SGD
    const entry = MAS_EXCHANGE_RATES[from];
    if (!entry) {
      return { error: `Unsupported currency: ${from}. Supported: ${Object.keys(MAS_EXCHANGE_RATES).join(", ")}` };
    }
    rate = entry.rate;
    convertedAmount = parseFloat((amount * rate).toFixed(4));
  }

  return {
    amount,
    from_currency: from,
    to_currency: to,
    converted_amount: convertedAmount,
    rate,
    reference_date: "2026-04-11",
    source: "MAS Reference Rates (indicative)",
    note: "Indicative rate only. Actual transaction rates may differ.",
  };
}

function handleGetSgInterestRates() {
  return {
    as_of: "2026-04-11",
    source: "MAS / CPF Board / MAS SSB",
    rates: {
      sora: {
        overnight: { rate_pct: 3.35, description: "Singapore Overnight Rate Average" },
        compound_1m: { rate_pct: 3.42, description: "SORA 1-month compounded" },
        compound_3m: { rate_pct: 3.48, description: "SORA 3-month compounded" },
      },
      cpf: {
        ordinary_account: { rate_pct: 2.5, description: "CPF Ordinary Account (OA) floor rate" },
        special_account: { rate_pct: 4.08, description: "CPF Special Account (SA) rate" },
        medisave_account: { rate_pct: 4.08, description: "CPF MediSave Account (MA) rate" },
        retirement_account: { rate_pct: 4.08, description: "CPF Retirement Account (RA) rate" },
        note: "CPF OA has a legislated floor of 2.5%. SA/MA/RA rates are pegged to the 12-month average yield of 10-year SGS+1%, with a floor of 4%.",
      },
      ssb: {
        average_10y_yield_pct: 2.81,
        description: "Singapore Savings Bonds 10-year average yield",
        note: "SSB rates are revised monthly based on SGS yields. Early redemption with no penalty.",
      },
      fixed_deposits: {
        range_pct: "2.0 - 3.5",
        description: "Indicative bank fixed deposit rates (12-month tenor)",
        note: "Rates vary by bank, tenor, and minimum deposit amount.",
      },
    },
    disclaimer: "Rates are indicative and subject to change. Verify with the respective institution before making financial decisions.",
  };
}

function handleGetSgxMarketData() {
  return {
    as_of: "2026-04-11",
    source: "SGX (Singapore Exchange)",
    indices: {
      straits_times_index: {
        ticker: "STI",
        level: 3450,
        unit: "points",
        components: 30,
        description: "Benchmark index of the top 30 companies by market cap listed on SGX",
      },
    },
    market_overview: {
      total_listings: 680,
      total_listings_approx: true,
      market_cap_sgd_billion: 750,
      market_cap_approx: true,
      currency: "SGD",
    },
    sector_breakdown: {
      financials: { weight_pct: 40, description: "Banks (DBS, OCBC, UOB), insurers, financial services" },
      industrials: { weight_pct: 15, description: "Conglomerates, engineering, offshore & marine" },
      reits: { weight_pct: 12, description: "Real Estate Investment Trusts — Singapore is Asia's largest REIT market" },
      technology: { weight_pct: 10, description: "Semiconductor, IT services, fintech" },
      property: { weight_pct: 8, description: "Property developers (CapitaLand, City Developments, UOL)" },
      others: { weight_pct: 15, description: "Healthcare, consumer, telecommunications, transport" },
    },
    top_s_reits: [
      { name: "CapitaLand Integrated Commercial Trust", ticker: "CICT", focus: "Integrated commercial (retail + office)" },
      { name: "Mapletree Pan Asia Commercial Trust", ticker: "MPACT", focus: "Office and retail across Asia" },
      { name: "Mapletree Logistics Trust", ticker: "MLT", focus: "Logistics and warehousing across Asia-Pacific" },
      { name: "Ascendas Real Estate Investment Trust", ticker: "CLAR", focus: "Business parks, logistics, industrial" },
      { name: "Keppel DC REIT", ticker: "AJBU", focus: "Data centres across Asia-Pacific and Europe" },
    ],
    ipo_requirements: {
      mainboard: {
        market_cap_min_sgd_million: 150,
        profitability: "Cumulative pre-tax profit of at least SGD 30M over last 3 years, with each year at least SGD 1M",
        operating_track_record_years: 3,
        alternative: "Market cap of at least SGD 150M with revenue track record, or market cap of at least SGD 300M (no revenue requirement for mineral/oil/gas companies).",
      },
      catalist: {
        description: "Sponsor-supervised board for fast-growing companies",
        no_quantitative_criteria: true,
        sponsor_required: true,
        note: "No minimum profit or market cap — admission is assessed by full sponsor through a holistic evaluation.",
      },
    },
    disclaimer: "Market data is indicative and for informational purposes only. Not investment advice. Verify with SGX or a licensed financial adviser.",
  };
}

// ── Tool Call Dispatcher ─────────────────────────────────────────────────────

function handleToolCall(
  ctx: ExecutionContext,
  toolName: string,
  args: Record<string, unknown>,
  tier: string
): { result: unknown; isError: boolean } {
  const start = Date.now();
  let result: unknown;
  let isError = false;

  try {
    switch (toolName) {
      case "get_mas_exchange_rates":
        result = handleGetMasExchangeRates();
        break;
      case "calculate_currency_conversion":
        result = handleCalculateCurrencyConversion(args as { amount?: number; from_currency?: string; to_currency?: string });
        break;
      case "get_sg_interest_rates":
        result = handleGetSgInterestRates();
        break;
      case "get_sgx_market_data":
        result = handleGetSgxMarketData();
        break;
      default:
        result = { error: `Unknown tool: ${toolName}` };
        isError = true;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    result = { error: message };
    isError = true;
  }

  const latencyMs = Date.now() - start;
  const httpStatus = isError ? 400 : 200;
  reportTelemetry(ctx, toolName, !isError, latencyMs, httpStatus);

  // Attach meta to result
  if (typeof result === "object" && result !== null) {
    (result as Record<string, unknown>)._meta = buildMeta(tier);
  }

  return { result, isError };
}

// ── Rate Limiting ────────────────────────────────────────────────────────────

async function checkRateLimit(
  env: Env,
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `free:${ip}:${today}`;
  const raw = await env.RATE_LIMIT.get(key);
  const count = raw ? parseInt(raw, 10) : 0;

  if (count >= FREE_TIER_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 86400 });
  return { allowed: true, remaining: FREE_TIER_DAILY_LIMIT - count - 1 };
}

async function validateApiKey(env: Env, token: string): Promise<boolean> {
  const record = await env.API_KEYS.get(token);
  return record !== null;
}

// ── CORS Headers ─────────────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function corsResponse(status: number, body: unknown, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extra },
  });
}

function jsonRpcError(id: unknown, code: number, message: string, httpStatus = 200): Response {
  return corsResponse(httpStatus, {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message },
  });
}

function jsonRpcResult(id: unknown, result: unknown): Response {
  return corsResponse(200, { jsonrpc: "2.0", id: id ?? null, result });
}

// ── Delay Helper ─────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main Fetch Handler ───────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ── Health endpoint ──────────────────────────────────────────────────
    if (path === "/health") {
      return corsResponse(200, {
        status: "ok",
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        timestamp: new Date().toISOString(),
      });
    }

    // ── Well-known MCP discovery ─────────────────────────────────────────
    if (path === "/.well-known/mcp.json") {
      return corsResponse(200, {
        name: SERVICE_NAME,
        version: SERVICE_VERSION,
        description: "Singapore finance data MCP server providing MAS exchange rates, interest rates, currency conversion, and SGX market data.",
        url: SELF_URL + "/mcp",
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
        upgrade_url: UPGRADE_URL,
      });
    }

    // ── Root info ────────────────────────────────────────────────────────
    if (path === "/") {
      return corsResponse(200, {
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        mcp_endpoint: SELF_URL + "/mcp",
        health: SELF_URL + "/health",
        discovery: SELF_URL + "/.well-known/mcp.json",
        upgrade_url: UPGRADE_URL,
      });
    }

    // ── MCP endpoint (JSON-RPC 2.0) ──────────────────────────────────────
    if (path === "/mcp") {
      if (request.method !== "POST") {
        return jsonRpcError(null, -32600, "Only POST is accepted on /mcp", 405);
      }

      let body: {
        jsonrpc?: string;
        id?: unknown;
        method?: string;
        params?: Record<string, unknown>;
      };
      try {
        body = await request.json();
      } catch {
        return jsonRpcError(null, -32700, "Parse error: invalid JSON");
      }

      const { jsonrpc, id, method, params } = body;

      if (jsonrpc !== "2.0") {
        return jsonRpcError(id, -32600, "Invalid Request: jsonrpc must be '2.0'");
      }

      // ── initialize ────────────────────────────────────────────────────
      if (method === "initialize") {
        return jsonRpcResult(id, {
          protocolVersion: "2024-11-05",
          serverInfo: { name: SERVICE_NAME, version: SERVICE_VERSION },
          capabilities: { tools: { listChanged: false } },
        });
      }

      // ── tools/list ────────────────────────────────────────────────────
      if (method === "tools/list") {
        return jsonRpcResult(id, { tools: TOOLS });
      }

      // ── tools/call ────────────────────────────────────────────────────
      if (method === "tools/call") {
        const toolName = (params?.name as string) || "";
        const toolArgs = (params?.arguments as Record<string, unknown>) || {};

        // ── Auth / rate-limit ───────────────────────────────────────────
        const authHeader = request.headers.get("Authorization") || "";
        const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
        let tier = "free";

        if (bearerToken) {
          const valid = await validateApiKey(env, bearerToken);
          if (valid) {
            tier = "paid";
          } else {
            return jsonRpcError(id, -32001, "Invalid API key. Obtain one at " + UPGRADE_URL);
          }
        }

        if (tier === "free") {
          const ip = request.headers.get("CF-Connecting-IP") || "unknown";
          const { allowed, remaining } = await checkRateLimit(env, ip);

          if (!allowed) {
            return corsResponse(429, {
              jsonrpc: "2.0",
              id: id ?? null,
              error: {
                code: -32002,
                message: `Free tier daily limit (${FREE_TIER_DAILY_LIMIT} requests) exceeded. Upgrade at ${UPGRADE_URL}`,
              },
            });
          }

          // Free-tier artificial delay
          await delay(FREE_TIER_DELAY_MS);
        }

        // ── Execute tool ────────────────────────────────────────────────
        const { result, isError } = handleToolCall(ctx, toolName, toolArgs, tier);

        return jsonRpcResult(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError,
        });
      }

      // ── Unknown method ────────────────────────────────────────────────
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
    }

    // ── 404 ──────────────────────────────────────────────────────────────
    return corsResponse(404, { error: "Not found", mcp_endpoint: SELF_URL + "/mcp" });
  },
};
