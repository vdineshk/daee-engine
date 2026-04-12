import { getLevyRates, LevyRatesInput } from "./tools/levy-rates";
import { getFilingDeadlines, FilingDeadlinesInput } from "./tools/filing-deadlines";
import { getPwmWages, PwmWagesInput } from "./tools/pwm-wages";
import { checkComplianceStatus, ComplianceStatusInput } from "./tools/compliance-status";
import { getSgHolidays, SgHolidaysInput } from "./tools/sg-holidays";
import { getEpSalaryBenchmarks, EpSalaryBenchmarksInput } from "./tools/ep-salary-benchmarks";
import { getSipEligibility, SipEligibilityInput } from "./tools/sip-eligibility";

// ---------------------------------------------------------------------------
// Types
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

interface ResponseMeta {
  tier: "free" | "paid";
  calls_remaining_today: number;
  timestamp: string;
  source: string;
  version: string;
  upgrade_url: string;
  pricing: {
    starter: string;
    pro: string;
    enterprise: string;
  };
  related_tools: {
    "sg-company-lookup": string;
    "asean-trade-rules": string;
  };
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_NAME = "sg-regulatory-data-mcp";
const SERVICE_VERSION = "1.1.0";
const UPGRADE_URL = "https://daee-sg-regulatory.vercel.app";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const SELF_URL = "https://sg-regulatory-data-mcp.sgdata.workers.dev";

function reportTelemetry(ctx: ExecutionContext, toolName: string, success: boolean, latencyMs: number, httpStatus: number) {
  ctx.waitUntil(
    fetch(OBSERVATORY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: Date.now(), method: "tools/call",
        params: { name: "report_interaction", arguments: { server_url: SELF_URL + "/mcp", success, latency_ms: latencyMs, tool_name: toolName, http_status: httpStatus } }
      })
    }).catch(() => {})
  );
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS: ToolDefinition[] = [
  {
    name: "get_levy_rates",
    description:
      "Current foreign worker levy rates by sector, tier, and dependency ratio ceiling. Use this tool when you need Singapore foreign worker levy information for workforce cost calculations, hiring decisions, or compliance checks.",
    inputSchema: {
      type: "object",
      properties: {
        sector: {
          type: "string",
          description:
            "Filter by sector: manufacturing, services, construction, process, marine_shipyard. Leave empty for all sectors.",
        },
      },
    },
  },
  {
    name: "get_filing_deadlines",
    description:
      "ACRA filing deadlines for any entity type with penalty amounts. Use this tool when you need to check annual return, AGM, or financial statement filing deadlines for Singapore companies.",
    inputSchema: {
      type: "object",
      properties: {
        entity_type: {
          type: "string",
          description:
            "Filter by entity type: private_limited, public_limited, llp, sole_proprietor, partnership. Leave empty for all types.",
        },
      },
    },
  },
  {
    name: "get_pwm_wages",
    description:
      "Progressive Wage Model minimum wages by sector and job level. Use this tool when you need minimum wage requirements for cleaning, security, landscape, retail, food services, or waste management sectors in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        sector: {
          type: "string",
          description:
            "Filter by sector: cleaning, security, landscape, retail, food_services, waste_management, administrator. Leave empty for all sectors.",
        },
      },
    },
  },
  {
    name: "check_compliance_status",
    description:
      "Given a company profile, return all active regulatory deadlines and requirements. Use this tool when you need a comprehensive compliance checklist for a Singapore business.",
    inputSchema: {
      type: "object",
      properties: {
        entity_type: {
          type: "string",
          description: "Company entity type: private_limited, public_limited, llp, sole_proprietor, partnership.",
        },
        incorporation_date: {
          type: "string",
          description: "Date of incorporation in YYYY-MM-DD format. Used to calculate first-AGM deadlines.",
        },
        financial_year_end: {
          type: "string",
          description: "Financial year end date in YYYY-MM-DD format. Used to calculate upcoming filing deadlines.",
        },
        sector: {
          type: "string",
          description: "Business sector. Used to check PWM and levy applicability.",
        },
        has_foreign_workers: {
          type: "boolean",
          description: "Whether the company employs foreign workers on Work Permits or S Passes.",
        },
      },
      required: ["entity_type"],
    },
  },
  {
    name: "get_sg_holidays",
    description:
      "Singapore public holidays with business day calculations. Use this tool when you need to calculate business days or check holiday dates in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        year: {
          type: "number",
          description: "Year to retrieve holidays for (2025 or 2026). Defaults to 2025.",
        },
        start_date: {
          type: "string",
          description: "Start date for business day calculation in YYYY-MM-DD format.",
        },
        num_business_days: {
          type: "number",
          description: "Number of business days to count forward from start_date.",
        },
      },
    },
  },
  {
    name: "get_ep_salary_benchmarks",
    description:
      "Employment Pass qualifying salary benchmarks by sector and age. Returns minimum salary thresholds for EP applications including age-based adjustments and COMPASS exemption threshold. Use this tool when you need to check EP salary requirements for hiring foreign professionals in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        sector: {
          type: "string",
          description: "Sector: general or financial_services. Leave empty for all sectors.",
        },
        age: {
          type: "number",
          description: "Applicant age in years. Salary threshold increases by $200 per year above age 23. Defaults to 23.",
        },
      },
    },
  },
  {
    name: "get_sip_eligibility",
    description:
      "Simplified Insolvency Programme (SIP) 2.0 eligibility check. Returns Track D (Dissolution) and Track R (Restructuring) criteria and optionally assesses eligibility based on company details. Use this tool when you need to check if a Singapore company qualifies for simplified insolvency or restructuring under SIP 2.0 launched January 2026.",
    inputSchema: {
      type: "object",
      properties: {
        entity_type: {
          type: "string",
          description: "Company entity type (for context only, all Singapore-incorporated companies eligible).",
        },
        total_liabilities: {
          type: "number",
          description: "Total company liabilities in SGD. Track D limit: $150,000. Track R limit: $2,000,000.",
        },
        annual_revenue: {
          type: "number",
          description: "Annual revenue in SGD. Track R limit: $10,000,000.",
        },
        num_employees: {
          type: "number",
          description: "Number of employees. Track R limit: 30.",
        },
        num_creditors: {
          type: "number",
          description: "Number of creditors. Track D limit: 30. Track R limit: 50.",
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Meta builder
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
      "sg-company-lookup": "https://sg-company-lookup-mcp.sgdata.workers.dev",
      "asean-trade-rules": "https://asean-trade-rules-mcp.sgdata.workers.dev",
      "sg-cpf-calculator": "https://sg-cpf-calculator-mcp.sgdata.workers.dev",
      "sg-workpass-compass": "https://sg-workpass-compass-mcp.sgdata.workers.dev",
    },
    trust_score_url: `https://dominion-observatory.sgdata.workers.dev/api/trust?url=${encodeURIComponent(SELF_URL + "/mcp")}`,
    observatory: "https://dominion-observatory.sgdata.workers.dev",
    telemetry: "This server reports anonymized interaction metrics (success/fail, latency, tool name) to the Dominion Observatory for trust scoring. No query content or user data is collected.",
  };
}

// ---------------------------------------------------------------------------
// Rate limiting helpers
// ---------------------------------------------------------------------------

function getTodayKey(ip: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `rate:${ip}:${today}`;
}

async function checkRateLimit(
  env: Env,
  ip: string
): Promise<{ allowed: boolean; callsUsed: number; callsRemaining: number }> {
  try {
    const key = getTodayKey(ip);
    const raw = await env.RATE_LIMIT.get(key);
    const callsUsed = raw ? parseInt(raw, 10) : 0;
    const callsRemaining = Math.max(0, FREE_TIER_DAILY_LIMIT - callsUsed);

    return {
      allowed: callsUsed < FREE_TIER_DAILY_LIMIT,
      callsUsed,
      callsRemaining,
    };
  } catch {
    // If KV fails, allow the request but log concern
    return { allowed: true, callsUsed: 0, callsRemaining: FREE_TIER_DAILY_LIMIT };
  }
}

async function incrementRateLimit(env: Env, ip: string): Promise<number> {
  try {
    const key = getTodayKey(ip);
    const raw = await env.RATE_LIMIT.get(key);
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;
    // TTL of 24 hours (86400 seconds)
    await env.RATE_LIMIT.put(key, String(next), { expirationTtl: 86400 });
    return Math.max(0, FREE_TIER_DAILY_LIMIT - next);
  } catch {
    return 0;
  }
}

async function validateApiKey(env: Env, key: string): Promise<boolean> {
  try {
    if (!key.startsWith("daee_sk_")) {
      return false;
    }
    const value = await env.API_KEYS.get(key);
    return value !== null;
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

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

function jsonResponse(body: unknown, status: number = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers,
    },
  });
}

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

function executeTool(
  toolName: string,
  args: Record<string, unknown>
): { data: unknown; summary: string } {
  switch (toolName) {
    case "get_levy_rates": {
      const input: LevyRatesInput = { sector: args.sector as string | undefined };
      const result = getLevyRates(input);
      return { data: result, summary: result.summary };
    }
    case "get_filing_deadlines": {
      const input: FilingDeadlinesInput = { entity_type: args.entity_type as string | undefined };
      const result = getFilingDeadlines(input);
      return { data: result, summary: result.summary };
    }
    case "get_pwm_wages": {
      const input: PwmWagesInput = { sector: args.sector as string | undefined };
      const result = getPwmWages(input);
      return { data: result, summary: result.summary };
    }
    case "check_compliance_status": {
      const input: ComplianceStatusInput = {
        entity_type: args.entity_type as string,
        incorporation_date: args.incorporation_date as string | undefined,
        financial_year_end: args.financial_year_end as string | undefined,
        sector: args.sector as string | undefined,
        has_foreign_workers: args.has_foreign_workers as boolean | undefined,
      };
      const result = checkComplianceStatus(input);
      return { data: result, summary: result.summary };
    }
    case "get_sg_holidays": {
      const input: SgHolidaysInput = {
        year: args.year as number | undefined,
        start_date: args.start_date as string | undefined,
        num_business_days: args.num_business_days as number | undefined,
      };
      const result = getSgHolidays(input);
      return { data: result, summary: result.summary };
    }
    case "get_ep_salary_benchmarks": {
      const input: EpSalaryBenchmarksInput = {
        sector: args.sector as string | undefined,
        age: args.age as number | undefined,
      };
      const result = getEpSalaryBenchmarks(input);
      return { data: result, summary: result.summary };
    }
    case "get_sip_eligibility": {
      const input: SipEligibilityInput = {
        entity_type: args.entity_type as string | undefined,
        total_liabilities: args.total_liabilities as number | undefined,
        annual_revenue: args.annual_revenue as number | undefined,
        num_employees: args.num_employees as number | undefined,
        num_creditors: args.num_creditors as number | undefined,
      };
      const result = getSipEligibility(input);
      return { data: result, summary: result.summary };
    }
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// ---------------------------------------------------------------------------
// MCP Protocol handlers
// ---------------------------------------------------------------------------

function handleInitialize(id: string | number | null): JsonRpcResponse {
  return jsonRpcSuccess(id, {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: SERVICE_NAME,
      version: SERVICE_VERSION,
    },
  });
}

function handleToolsList(id: string | number | null): JsonRpcResponse {
  return jsonRpcSuccess(id, { tools: TOOLS });
}

async function handleToolCall(
  id: string | number | null,
  params: Record<string, unknown>,
  env: Env,
  request: Request,
  ctx: ExecutionContext
): Promise<{ response: JsonRpcResponse; status: number }> {
  const startTime = Date.now();
  const toolName = params.name as string;
  const toolArgs = (params.arguments as Record<string, unknown>) || {};

  if (!toolName) {
    return {
      response: jsonRpcError(id, -32602, "Missing tool name in params.name"),
      status: 400,
    };
  }

  const toolExists = TOOLS.some((t) => t.name === toolName);
  if (!toolExists) {
    return {
      response: jsonRpcError(id, -32602, `Unknown tool: ${toolName}. Available tools: ${TOOLS.map((t) => t.name).join(", ")}`),
      status: 400,
    };
  }

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
      const meta = buildMeta("free", 0);
      return {
        response: jsonRpcError(id, 429, "Rate limit exceeded. Free tier allows 5 calls/day. Upgrade for unlimited access.", {
          meta,
          upgrade_url: UPGRADE_URL,
        }),
        status: 429,
      };
    }

    await new Promise((r) => setTimeout(r, FREE_TIER_DELAY_MS));
    callsRemaining = await incrementRateLimit(env, clientIp);
  }

  try {
    const { data, summary } = executeTool(toolName, toolArgs);
    const meta = buildMeta(tier, callsRemaining);
    reportTelemetry(ctx, toolName, true, Date.now() - startTime, 200);

    return {
      response: jsonRpcSuccess(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify({ data, meta }, null, 2),
          },
        ],
        _meta: { summary },
      }),
      status: 200,
    };
  } catch (error) {
    const meta = buildMeta(tier, callsRemaining);
    reportTelemetry(ctx, toolName, false, Date.now() - startTime, 500);
    return {
      response: jsonRpcError(id, -32603, error instanceof Error ? error.message : String(error), { meta }),
      status: 500,
    };
  }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

function handleHealth(): Response {
  return jsonResponse({
    status: "ok",
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    timestamp: new Date().toISOString(),
  });
}

function handleDiscovery(): Response {
  return jsonResponse({
    name: SERVICE_NAME,
    version: SERVICE_VERSION,
    description:
      "MCP server exposing structured Singapore regulatory data to AI agents. Covers foreign worker levies, ACRA filing deadlines, Progressive Wage Model rates, compliance checklists, and public holidays.",
    protocol: "mcp",
    protocol_version: "2024-11-05",
    endpoint: "/mcp",
    capabilities: {
      tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    },
    authentication: {
      type: "bearer",
      description: "Include API key as Bearer token for paid tier access. Free tier: 5 calls/day with 3-second delay.",
    },
    pricing: {
      free: "5 calls/day with 3-second delay",
      starter: "$29/month - 1,000 calls/month",
      pro: "$99/month - 10,000 calls/month",
      enterprise: "$299/month - unlimited calls",
    },
    upgrade_url: UPGRADE_URL,
  });
}

function handleIndex(): Response {
  return jsonResponse({
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    description:
      "Singapore Regulatory Data MCP Server - Structured regulatory data for AI agents. Covers foreign worker levies (MOM), ACRA filing deadlines, Progressive Wage Model (PWM) rates, compliance checklists, and SG public holidays.",
    endpoints: {
      "GET /": "This info page",
      "GET /health": "Health check",
      "GET /.well-known/mcp.json": "MCP discovery metadata",
      "POST /mcp": "MCP JSON-RPC 2.0 endpoint",
    },
    tools: TOOLS.map((t) => t.name),
    documentation: UPGRADE_URL,
    free_tier: "5 calls/day with 3-second delay. No API key required.",
    paid_tier: "Unlimited calls, no delay. Include Authorization: Bearer daee_sk_xxxxx header.",
  });
}

async function handleMcp(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: JsonRpcRequest;

  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return jsonResponse(jsonRpcError(null, -32700, "Parse error: invalid JSON"), 400);
  }

  if (body.jsonrpc !== "2.0") {
    return jsonResponse(
      jsonRpcError(body.id ?? null, -32600, "Invalid request: jsonrpc must be '2.0'"),
      400
    );
  }

  const id = body.id ?? null;
  const method = body.method;
  const params = (body.params || {}) as Record<string, unknown>;

  switch (method) {
    case "initialize": {
      return jsonResponse(handleInitialize(id));
    }

    case "notifications/initialized": {
      // Client acknowledgement - no response needed but return empty success
      return jsonResponse(jsonRpcSuccess(id, {}));
    }

    case "tools/list": {
      return jsonResponse(handleToolsList(id));
    }

    case "tools/call": {
      const { response, status } = await handleToolCall(id, params, env, request, ctx);
      return jsonResponse(response, status);
    }

    default: {
      return jsonResponse(
        jsonRpcError(id, -32601, `Method not found: ${method}`),
        400
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Worker entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
          },
        });
      }

      const url = new URL(request.url);
      const path = url.pathname;

      // Route handling
      if (request.method === "GET" && path === "/health") {
        return handleHealth();
      }

      if (request.method === "GET" && path === "/.well-known/mcp.json") {
        return handleDiscovery();
      }

      if (request.method === "POST" && path === "/mcp") {
        return await handleMcp(request, env, ctx);
      }

      if (request.method === "GET" && path === "/") {
        return handleIndex();
      }

      // 404 for all other routes
      return jsonResponse(
        {
          error: "Not found",
          available_endpoints: ["/", "/health", "/.well-known/mcp.json", "/mcp"],
        },
        404
      );
    } catch (error) {
      return jsonResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : String(error),
          service: SERVICE_NAME,
          version: SERVICE_VERSION,
          timestamp: new Date().toISOString(),
        },
        500
      );
    }
  },
};
