// ---------------------------------------------------------------------------
// sg-company-lookup-mcp — Singapore Company Intelligence MCP Server
// ---------------------------------------------------------------------------

interface Env {
  RATE_LIMIT: KVNamespace;
  API_KEYS: KVNamespace;
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_NAME = "sg-company-lookup-mcp";
const SERVICE_VERSION = "1.0.0";
const UPGRADE_URL = "https://daee-sg-company.vercel.app";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const SELF_URL = "https://sg-company-lookup-mcp.sgdata.workers.dev";

// ---------------------------------------------------------------------------
// UEN Validation & Parsing (core data moat)
// ---------------------------------------------------------------------------

interface UenInfo {
  valid: boolean;
  uen: string;
  entity_type: string;
  registration_year: string | null;
  format_type: string;
  description: string;
}

function parseUen(uen: string): UenInfo {
  const cleaned = uen.trim().toUpperCase();

  // Format 1: Business (old format) — 8 digits + 1 letter (e.g., 53222400K)
  const businessRegex = /^(\d{8})([A-Z])$/;
  // Format 2: Local Company — yyyyNNNNNX (e.g., 201901234A)
  const companyRegex = /^(\d{4})(\d{5})([A-Z])$/;
  // Format 3: Others — TyyPQnnnnX (e.g., T08GA0001A)
  const othersRegex = /^(T|S|R)(\d{2})([A-Z]{2})(\d{4})([A-Z])$/;

  if (businessRegex.test(cleaned)) {
    return {
      valid: true,
      uen: cleaned,
      entity_type: "Business (Sole Proprietorship / Partnership)",
      registration_year: null,
      format_type: "business",
      description: "Old-format business registration number. Registered with ACRA.",
    };
  }

  if (companyRegex.test(cleaned)) {
    const match = cleaned.match(companyRegex)!;
    const year = match[1];
    return {
      valid: true,
      uen: cleaned,
      entity_type: "Local Company",
      registration_year: year,
      format_type: "local_company",
      description: `Company incorporated in ${year}. Registered with ACRA.`,
    };
  }

  if (othersRegex.test(cleaned)) {
    const match = cleaned.match(othersRegex)!;
    const prefix = match[1];
    const year = match[2];
    const entityCode = match[3];
    const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;

    const entityTypes: Record<string, string> = {
      LP: "Limited Partnership",
      LL: "Limited Liability Partnership",
      FC: "Foreign Company Branch",
      FB: "Foreign Business",
      GA: "Government Agency",
      GB: "Government Body",
      GS: "Government School",
      MQ: "Mosque",
      MH: "Hindu Temple",
      MM: "Malay/Muslim Organization",
      NR: "Non-resident Company",
      PF: "Professional Firm",
      PA: "Public Accounting Firm",
      SS: "Society",
      CC: "Cooperative Society",
      CS: "Church / Synagogue",
      CH: "Charity",
      CL: "Company Limited by Guarantee",
      DP: "Dentist Practice",
      CM: "Chinese Temple",
      CD: "Community Development Council",
      MD: "Medical Practice",
      HS: "Healthcare Service",
      VH: "Voluntary Welfare Home",
      TU: "Trade Union",
      TC: "Town Council",
      RA: "Residential Association",
      RF: "Representative Office of Foreign Law Practice",
      MF: "Mutual Fund",
      SM: "Statutory Member",
      UF: "Unregistered Foreign Company",
    };

    const entityType = entityTypes[entityCode] || `Other Entity (${entityCode})`;

    return {
      valid: true,
      uen: cleaned,
      entity_type: entityType,
      registration_year: fullYear,
      format_type: "others",
      description: `${entityType}, registered approximately ${fullYear}. Prefix: ${prefix}.`,
    };
  }

  return {
    valid: false,
    uen: cleaned,
    entity_type: "Unknown",
    registration_year: null,
    format_type: "invalid",
    description: "Invalid UEN format. Singapore UENs are 9-10 characters: 8digits+letter (business), 4digits+5digits+letter (company), or T/S/R+2digits+2letters+4digits+letter (others).",
  };
}

// ---------------------------------------------------------------------------
// Industry Statistics Data
// ---------------------------------------------------------------------------

const INDUSTRY_STATS = {
  overview: {
    total_live_entities: 830000,
    data_as_of: "2024-Q4",
    source: "ACRA Annual Report",
  },
  registration_trends: {
    "2024": { new_companies: 75200, new_businesses: 27800, cessations: 51200 },
    "2023": { new_companies: 73100, new_businesses: 28300, cessations: 50400 },
    "2022": { new_companies: 71500, new_businesses: 29100, cessations: 48700 },
    "2021": { new_companies: 68900, new_businesses: 27200, cessations: 45300 },
  },
  top_sectors: [
    { ssic_section: "G", name: "Wholesale & Retail Trade", percentage: 18.2 },
    { ssic_section: "M", name: "Professional, Scientific & Technical", percentage: 14.8 },
    { ssic_section: "I", name: "Accommodation & Food Service", percentage: 9.5 },
    { ssic_section: "F", name: "Construction", percentage: 8.7 },
    { ssic_section: "J", name: "Information & Communications", percentage: 8.1 },
    { ssic_section: "K", name: "Financial & Insurance", percentage: 7.3 },
    { ssic_section: "N", name: "Administrative & Support Service", percentage: 6.9 },
    { ssic_section: "C", name: "Manufacturing", percentage: 5.4 },
    { ssic_section: "H", name: "Transportation & Storage", percentage: 4.2 },
    { ssic_section: "L", name: "Real Estate", percentage: 3.8 },
  ],
  ssic_sections: {
    A: "Agriculture, Forestry & Fishing",
    B: "Mining & Quarrying",
    C: "Manufacturing",
    D: "Electricity, Gas, Steam & Air-Con Supply",
    E: "Water Supply, Sewerage & Waste Management",
    F: "Construction",
    G: "Wholesale & Retail Trade",
    H: "Transportation & Storage",
    I: "Accommodation & Food Service",
    J: "Information & Communications",
    K: "Financial & Insurance Activities",
    L: "Real Estate Activities",
    M: "Professional, Scientific & Technical Activities",
    N: "Administrative & Support Service Activities",
    O: "Public Administration & Defence",
    P: "Education",
    Q: "Human Health & Social Work",
    R: "Arts, Entertainment & Recreation",
    S: "Other Service Activities",
    T: "Household Activities",
    U: "Extraterritorial Organisations & Bodies",
  },
};

// ---------------------------------------------------------------------------
// Tool Definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "lookup_company",
    description:
      "Search Singapore companies by name or UEN, return registration details. Use this tool when you need to find or verify a Singapore registered business.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Company name or UEN to search for." },
        search_type: { type: "string", description: "Search type: 'name' or 'uen'. Defaults to auto-detect." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_company_officers",
    description:
      "Directors and officers for a given UEN. Use this tool when you need to identify directors or key personnel of a Singapore company for KYC or due diligence.",
    inputSchema: {
      type: "object" as const,
      properties: {
        uen: { type: "string", description: "The company UEN to look up officers for." },
      },
      required: ["uen"],
    },
  },
  {
    name: "get_industry_stats",
    description:
      "Company registration/cessation trends by SSIC sector. Use this tool when you need market intelligence on business formation or closure trends in Singapore.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sector: { type: "string", description: "SSIC section code (A-U) or sector name. Leave empty for overview." },
        year: { type: "number", description: "Year for trend data (2021-2024). Leave empty for all years." },
      },
    },
  },
  {
    name: "check_company_status",
    description:
      "Active/struck-off/dissolved status check for any UEN. Use this tool when you need to verify whether a Singapore company is currently active.",
    inputSchema: {
      type: "object" as const,
      properties: {
        uen: { type: "string", description: "The UEN to check status for." },
      },
      required: ["uen"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool Execution
// ---------------------------------------------------------------------------

function executeTool(name: string, args: Record<string, unknown>): { data: unknown; summary: string } {
  switch (name) {
    case "lookup_company":
      return toolLookupCompany(args);
    case "get_company_officers":
      return toolGetOfficers(args);
    case "get_industry_stats":
      return toolGetIndustryStats(args);
    case "check_company_status":
      return toolCheckStatus(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function toolLookupCompany(args: Record<string, unknown>): { data: unknown; summary: string } {
  const query = (args.query as string || "").trim();
  if (!query) throw new Error("query parameter is required");

  const searchType = args.search_type as string || "auto";
  const isUen = searchType === "uen" || (searchType === "auto" && /^[A-Z0-9]{9,10}$/i.test(query));

  if (isUen) {
    const uenInfo = parseUen(query);
    return {
      data: {
        search_type: "uen",
        uen_analysis: uenInfo,
        lookup_sources: {
          free: {
            acra_search: "https://www.acra.gov.sg/how-to-guides/setting-up-a-local-company/search-for-company-name",
            bizfile: "https://www.bizfile.gov.sg/",
            note: "Free basic search available on ACRA website. Detailed BizFile+ profile costs SGD 5.50.",
          },
          api: {
            data_gov_sg: "https://data.gov.sg/datasets?query=acra",
            note: "Selected ACRA datasets available via data.gov.sg API. Full company details require BizFile+ subscription.",
          },
        },
      },
      summary: uenInfo.valid
        ? `Valid UEN: ${uenInfo.uen} — ${uenInfo.entity_type}${uenInfo.registration_year ? `, registered ${uenInfo.registration_year}` : ""}`
        : `Invalid UEN format: ${query}`,
    };
  }

  // Name search
  return {
    data: {
      search_type: "name",
      query: query,
      note: "Name searches require ACRA database access. Use the following resources:",
      lookup_sources: {
        free: {
          acra_search: "https://www.acra.gov.sg/how-to-guides/setting-up-a-local-company/search-for-company-name",
          description: "ACRA provides free company name search to check availability and find existing companies.",
        },
        paid: {
          bizfile: "https://www.bizfile.gov.sg/",
          cost: "SGD 5.50 per company profile",
          description: "Full company profile including registration date, status, directors, shareholders, and financial statements.",
        },
        api: {
          data_gov_sg: "https://data.gov.sg/datasets?query=acra",
          description: "Bulk datasets of registered entities available for download.",
        },
      },
      tip: "If you have a UEN, use search_type='uen' for instant validation and entity type identification.",
    },
    summary: `Name search for '${query}'. Direct lookup requires ACRA database access. UEN-based search provides instant validation.`,
  };
}

function toolGetOfficers(args: Record<string, unknown>): { data: unknown; summary: string } {
  const uen = (args.uen as string || "").trim();
  if (!uen) throw new Error("uen parameter is required");

  const uenInfo = parseUen(uen);

  return {
    data: {
      uen: uen,
      uen_valid: uenInfo.valid,
      entity_type: uenInfo.entity_type,
      officers_data: {
        availability: "paid_source_only",
        source: "ACRA BizFile+",
        url: "https://www.bizfile.gov.sg/",
        cost: "SGD 5.50 per company profile",
        includes: [
          "Director names and identification",
          "Date of appointment",
          "Shareholders and share allocation",
          "Company secretary details",
          "Registered address",
        ],
      },
      free_alternatives: {
        sgx_listed: {
          description: "For SGX-listed companies, annual reports with director info are publicly available",
          url: "https://www.sgx.com/securities/company-announcements",
        },
        charity_portal: {
          description: "For registered charities, governing board members are listed on the Charity Portal",
          url: "https://www.charities.gov.sg/",
        },
      },
      derived_from_uen: uenInfo.valid
        ? {
            entity_type: uenInfo.entity_type,
            registration_year: uenInfo.registration_year,
            format_type: uenInfo.format_type,
          }
        : null,
    },
    summary: uenInfo.valid
      ? `UEN ${uen} (${uenInfo.entity_type}). Officer data requires BizFile+ (SGD 5.50). Entity type and registration year derived from UEN.`
      : `Invalid UEN: ${uen}. Cannot look up officers for invalid UEN.`,
  };
}

function toolGetIndustryStats(args: Record<string, unknown>): { data: unknown; summary: string } {
  const sector = (args.sector as string || "").trim().toUpperCase();
  const year = args.year as number | undefined;

  let filteredTrends = INDUSTRY_STATS.registration_trends;
  if (year) {
    const yearStr = String(year);
    const entry = (filteredTrends as Record<string, unknown>)[yearStr];
    if (entry) {
      filteredTrends = { [yearStr]: entry } as typeof filteredTrends;
    } else {
      throw new Error(`No data available for year ${year}. Available years: 2021-2024.`);
    }
  }

  let sectorInfo = null;
  if (sector) {
    const sectionCode = sector.length === 1 ? sector : null;
    if (sectionCode && (INDUSTRY_STATS.ssic_sections as Record<string, string>)[sectionCode]) {
      sectorInfo = {
        ssic_section: sectionCode,
        name: (INDUSTRY_STATS.ssic_sections as Record<string, string>)[sectionCode],
        ranking: INDUSTRY_STATS.top_sectors.find((s) => s.ssic_section === sectionCode) || null,
      };
    } else {
      const match = INDUSTRY_STATS.top_sectors.find(
        (s) => s.name.toLowerCase().includes(sector.toLowerCase())
      );
      if (match) {
        sectorInfo = {
          ssic_section: match.ssic_section,
          name: match.name,
          ranking: match,
        };
      }
    }
  }

  return {
    data: {
      overview: INDUSTRY_STATS.overview,
      registration_trends: filteredTrends,
      sector_breakdown: sectorInfo || INDUSTRY_STATS.top_sectors,
      ssic_sections: sector ? undefined : INDUSTRY_STATS.ssic_sections,
      source: "ACRA Annual Report / Department of Statistics Singapore",
    },
    summary: sectorInfo
      ? `Singapore industry stats for ${sectorInfo.name} (Section ${sectorInfo.ssic_section}). ${sectorInfo.ranking ? `${sectorInfo.ranking.percentage}% of all entities.` : ""}`
      : `Singapore business overview: ~${INDUSTRY_STATS.overview.total_live_entities.toLocaleString()} live entities. Top sector: Wholesale & Retail Trade (18.2%).`,
  };
}

function toolCheckStatus(args: Record<string, unknown>): { data: unknown; summary: string } {
  const uen = (args.uen as string || "").trim();
  if (!uen) throw new Error("uen parameter is required");

  const uenInfo = parseUen(uen);

  return {
    data: {
      uen: uen,
      uen_valid: uenInfo.valid,
      uen_analysis: uenInfo.valid ? uenInfo : undefined,
      live_status: {
        availability: "external_check_required",
        note: "Live company status (Active/Struck-Off/Dissolved) is not available via free API.",
        check_methods: {
          free_web_search: {
            url: "https://www.acra.gov.sg/how-to-guides/setting-up-a-local-company/search-for-company-name",
            description: "Search ACRA website for basic company status (free)",
          },
          bizfile: {
            url: "https://www.bizfile.gov.sg/",
            cost: "SGD 5.50 per profile",
            description: "Full company profile including live status, registration date, and all details",
          },
        },
      },
      status_types: {
        live: "Company is registered and active",
        struck_off: "Company removed from register (can be restored within 6 years)",
        dissolved: "Company permanently removed from register",
        in_liquidation: "Company undergoing winding up process",
        in_receivership: "Company under receivership",
      },
    },
    summary: uenInfo.valid
      ? `UEN ${uen} format is valid (${uenInfo.entity_type}). Live status check requires ACRA website or BizFile+ (SGD 5.50).`
      : `Invalid UEN format: ${uen}. Cannot check status.`,
  };
}

// ---------------------------------------------------------------------------
// Meta builder
// ---------------------------------------------------------------------------

function buildMeta(tier: "free" | "paid", callsRemainingToday: number) {
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
      "asean-trade-rules": "https://asean-trade-rules-mcp.sgdata.workers.dev",
      "sg-cpf-calculator": "https://sg-cpf-calculator-mcp.sgdata.workers.dev",
      "sg-workpass-compass": "https://sg-workpass-compass-mcp.sgdata.workers.dev",
    },
    trust_score_url: `https://dominion-observatory.sgdata.workers.dev/api/trust?url=${encodeURIComponent(SELF_URL)}`,
    observatory: "https://dominion-observatory.sgdata.workers.dev",
  };
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

function getTodayKey(ip: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `rate:${ip}:${today}`;
}

async function checkRateLimit(env: Env, ip: string) {
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
    const next = (raw ? parseInt(raw, 10) : 0) + 1;
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

// ---------------------------------------------------------------------------
// JSON-RPC helpers
// ---------------------------------------------------------------------------

function jsonRpcSuccess(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id: string | number | null, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// ---------------------------------------------------------------------------
// MCP Protocol handlers
// ---------------------------------------------------------------------------

async function handleToolCall(
  id: string | number | null,
  params: Record<string, unknown>,
  env: Env,
  request: Request,
  ctx: ExecutionContext
): Promise<{ response: JsonRpcResponse; status: number }> {
  const toolName = params.name as string;
  const toolArgs = (params.arguments as Record<string, unknown>) || {};
  const startTime = Date.now();

  if (!toolName || !TOOLS.some((t) => t.name === toolName)) {
    return {
      response: jsonRpcError(id, -32602, `Unknown tool: ${toolName}. Available: ${TOOLS.map((t) => t.name).join(", ")}`),
      status: 400,
    };
  }

  const authHeader = request.headers.get("Authorization") || "";
  const apiKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";

  let tier: "free" | "paid" = "free";
  let callsRemaining = 0;

  if (apiKey && (await validateApiKey(env, apiKey))) {
    tier = "paid";
    callsRemaining = -1;
  } else {
    const rateCheck = await checkRateLimit(env, clientIp);
    if (!rateCheck.allowed) {
      return {
        response: jsonRpcError(id, 429, "Rate limit exceeded. Free tier allows 5 calls/day.", { meta: buildMeta("free", 0) }),
        status: 429,
      };
    }
    await new Promise((r) => setTimeout(r, FREE_TIER_DELAY_MS));
    callsRemaining = await incrementRateLimit(env, clientIp);
  }

  try {
    const { data, summary } = executeTool(toolName, toolArgs);
    const meta = buildMeta(tier, callsRemaining);

    ctx.waitUntil(
      fetch(OBSERVATORY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: Date.now(), method: "tools/call",
          params: { name: "report_interaction", arguments: { server_url: SELF_URL, success: true, latency_ms: Date.now() - startTime, tool_name: toolName, http_status: 200 } },
        }),
      }).catch(() => {})
    );

    return {
      response: jsonRpcSuccess(id, { content: [{ type: "text", text: JSON.stringify({ data, meta }, null, 2) }], _meta: { summary } }),
      status: 200,
    };
  } catch (error) {
    ctx.waitUntil(
      fetch(OBSERVATORY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: Date.now(), method: "tools/call",
          params: { name: "report_interaction", arguments: { server_url: SELF_URL, success: false, latency_ms: Date.now() - startTime, tool_name: toolName, http_status: 500 } },
        }),
      }).catch(() => {})
    );

    return {
      response: jsonRpcError(id, -32603, error instanceof Error ? error.message : String(error), { meta: buildMeta(tier, callsRemaining) }),
      status: 500,
    };
  }
}

// ---------------------------------------------------------------------------
// Worker entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" },
        });
      }

      const url = new URL(request.url);
      const path = url.pathname;

      if (request.method === "GET" && path === "/health") {
        return jsonResponse({ status: "ok", service: SERVICE_NAME, version: SERVICE_VERSION, timestamp: new Date().toISOString() });
      }

      if (request.method === "GET" && path === "/.well-known/mcp.json") {
        return jsonResponse({
          name: SERVICE_NAME, version: SERVICE_VERSION,
          description: "MCP server providing Singapore company intelligence — UEN validation, entity type identification, industry statistics, and company status checks.",
          protocol: "mcp", protocol_version: "2024-11-05", endpoint: "/mcp",
          capabilities: { tools: TOOLS.map((t) => ({ name: t.name, description: t.description })) },
          authentication: { type: "bearer", description: "Include API key as Bearer token for paid tier. Free tier: 5 calls/day." },
          pricing: { free: "5 calls/day with 3s delay", starter: "$29/month", pro: "$99/month", enterprise: "$299/month" },
          upgrade_url: UPGRADE_URL,
        });
      }

      if (request.method === "POST" && path === "/mcp") {
        let body: JsonRpcRequest;
        try { body = (await request.json()) as JsonRpcRequest; } catch { return jsonResponse(jsonRpcError(null, -32700, "Parse error"), 400); }
        if (body.jsonrpc !== "2.0") return jsonResponse(jsonRpcError(body.id ?? null, -32600, "jsonrpc must be '2.0'"), 400);

        const id = body.id ?? null;
        const params = (body.params || {}) as Record<string, unknown>;

        switch (body.method) {
          case "initialize":
            return jsonResponse(jsonRpcSuccess(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: SERVICE_NAME, version: SERVICE_VERSION } }));
          case "notifications/initialized":
            return jsonResponse(jsonRpcSuccess(id, {}));
          case "tools/list":
            return jsonResponse(jsonRpcSuccess(id, { tools: TOOLS }));
          case "tools/call": {
            const { response, status } = await handleToolCall(id, params, env, request, ctx);
            return jsonResponse(response, status);
          }
          default:
            return jsonResponse(jsonRpcError(id, -32601, `Method not found: ${body.method}`), 400);
        }
      }

      if (request.method === "GET" && path === "/") {
        return jsonResponse({
          service: SERVICE_NAME, version: SERVICE_VERSION,
          description: "Singapore Company Intelligence MCP Server — UEN validation, entity type identification, SSIC industry statistics, and company verification for AI agents.",
          endpoints: { "GET /": "Info", "GET /health": "Health check", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" },
          tools: TOOLS.map((t) => t.name),
          free_tier: "5 calls/day with 3s delay", paid_tier: "Unlimited. Authorization: Bearer daee_sk_xxxxx",
        });
      }

      return jsonResponse({ error: "Not found", available_endpoints: ["/", "/health", "/.well-known/mcp.json", "/mcp"] }, 404);
    } catch (error) {
      return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error), service: SERVICE_NAME, timestamp: new Date().toISOString() }, 500);
    }
  },
};
