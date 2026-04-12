// ---------------------------------------------------------------------------
// sg-cpf-calculator-mcp — Singapore CPF Contribution Calculator MCP Server
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

const SERVICE_NAME = "sg-cpf-calculator-mcp";
const SERVICE_VERSION = "1.1.0";
const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const SELF_URL = "https://sg-cpf-calculator-mcp.sgdata.workers.dev";

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
const UPGRADE_URL = "https://daee-sg-cpf.vercel.app";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;

// ---------------------------------------------------------------------------
// CPF Data Tables (effective 1 Jan 2026)
// ---------------------------------------------------------------------------

// Ordinary Wage (OW) ceiling: $8,000/month from Jan 2026
// Additional Wage (AW) ceiling: $102,000 - Total OW subject to CPF for the year
const OW_CEILING = 8000;
const AW_ANNUAL_CEILING = 102000;

// Skills Development Levy: 0.25% of gross monthly remuneration, min $2, max $11.25
const SDL_RATE = 0.0025;
const SDL_MIN = 2;
const SDL_MAX = 11.25;

type CitizenshipStatus = "citizen" | "spr_1st_year" | "spr_2nd_year" | "spr_3rd_year_onwards";

interface CpfRateRow {
  age_band: string;
  age_min: number;
  age_max: number;
  employee_rate: number;
  employer_rate: number;
  total_rate: number;
  oa_allocation: number; // share of total going to OA
  sa_allocation: number;
  ma_allocation: number;
}

// Singapore Citizen / SPR 3rd year onwards
const CITIZEN_RATES: CpfRateRow[] = [
  { age_band: "55 and below", age_min: 0, age_max: 55, employee_rate: 0.20, employer_rate: 0.17, total_rate: 0.37, oa_allocation: 0.6216, sa_allocation: 0.1622, ma_allocation: 0.2162 },
  { age_band: "Above 55 to 60", age_min: 56, age_max: 60, employee_rate: 0.16, employer_rate: 0.15, total_rate: 0.31, oa_allocation: 0.5161, sa_allocation: 0.1935, ma_allocation: 0.2903 },
  { age_band: "Above 60 to 65", age_min: 61, age_max: 65, employee_rate: 0.105, employer_rate: 0.115, total_rate: 0.22, oa_allocation: 0.1364, sa_allocation: 0.2727, ma_allocation: 0.5909 },
  { age_band: "Above 65 to 70", age_min: 66, age_max: 70, employee_rate: 0.075, employer_rate: 0.09, total_rate: 0.165, oa_allocation: 0.0606, sa_allocation: 0.3030, ma_allocation: 0.6364 },
  { age_band: "Above 70", age_min: 71, age_max: 150, employee_rate: 0.05, employer_rate: 0.075, total_rate: 0.125, oa_allocation: 0.08, sa_allocation: 0.08, ma_allocation: 0.84 },
];

// SPR 1st year (graduated rates, full employer-employee)
const SPR_1ST_YEAR_RATES: CpfRateRow[] = [
  { age_band: "55 and below", age_min: 0, age_max: 55, employee_rate: 0.05, employer_rate: 0.04, total_rate: 0.09, oa_allocation: 0.6667, sa_allocation: 0.1667, ma_allocation: 0.1667 },
  { age_band: "Above 55 to 60", age_min: 56, age_max: 60, employee_rate: 0.05, employer_rate: 0.04, total_rate: 0.09, oa_allocation: 0.5556, sa_allocation: 0.1667, ma_allocation: 0.2778 },
  { age_band: "Above 60 to 65", age_min: 61, age_max: 65, employee_rate: 0.05, employer_rate: 0.035, total_rate: 0.085, oa_allocation: 0.1176, sa_allocation: 0.2353, ma_allocation: 0.6471 },
  { age_band: "Above 65 to 70", age_min: 66, age_max: 70, employee_rate: 0.05, employer_rate: 0.035, total_rate: 0.085, oa_allocation: 0.0588, sa_allocation: 0.2353, ma_allocation: 0.7059 },
  { age_band: "Above 70", age_min: 71, age_max: 150, employee_rate: 0.05, employer_rate: 0.035, total_rate: 0.085, oa_allocation: 0.0588, sa_allocation: 0.0588, ma_allocation: 0.8824 },
];

// SPR 2nd year (graduated rates, full employer-employee)
const SPR_2ND_YEAR_RATES: CpfRateRow[] = [
  { age_band: "55 and below", age_min: 0, age_max: 55, employee_rate: 0.15, employer_rate: 0.09, total_rate: 0.24, oa_allocation: 0.625, sa_allocation: 0.1667, ma_allocation: 0.2083 },
  { age_band: "Above 55 to 60", age_min: 56, age_max: 60, employee_rate: 0.125, employer_rate: 0.09, total_rate: 0.215, oa_allocation: 0.5116, sa_allocation: 0.1860, ma_allocation: 0.3023 },
  { age_band: "Above 60 to 65", age_min: 61, age_max: 65, employee_rate: 0.05, employer_rate: 0.065, total_rate: 0.115, oa_allocation: 0.1304, sa_allocation: 0.2609, ma_allocation: 0.6087 },
  { age_band: "Above 65 to 70", age_min: 66, age_max: 70, employee_rate: 0.05, employer_rate: 0.065, total_rate: 0.115, oa_allocation: 0.0435, sa_allocation: 0.2609, ma_allocation: 0.6957 },
  { age_band: "Above 70", age_min: 71, age_max: 150, employee_rate: 0.05, employer_rate: 0.065, total_rate: 0.115, oa_allocation: 0.0435, sa_allocation: 0.0435, ma_allocation: 0.9130 },
];

const RATE_TABLES: Record<CitizenshipStatus, CpfRateRow[]> = {
  citizen: CITIZEN_RATES,
  spr_1st_year: SPR_1ST_YEAR_RATES,
  spr_2nd_year: SPR_2ND_YEAR_RATES,
  spr_3rd_year_onwards: CITIZEN_RATES,
};

function findRateRow(age: number, citizenship: CitizenshipStatus): CpfRateRow | null {
  const table = RATE_TABLES[citizenship];
  if (!table) return null;
  return table.find((r) => age >= r.age_min && age <= r.age_max) || null;
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function calculateCpf(args: Record<string, unknown>) {
  const grossWage = Number(args.gross_monthly_wage) || 0;
  const age = Number(args.age) || 30;
  const citizenship = (args.citizenship as CitizenshipStatus) || "citizen";
  const bonusAmount = Number(args.bonus_amount) || 0;
  const monthsWorked = Number(args.months_worked_this_year) || 12;

  const row = findRateRow(age, citizenship);
  if (!row) {
    return { error: "Invalid age or citizenship status", summary: "Could not find CPF rates for given parameters." };
  }

  // OW subject to CPF (capped at ceiling)
  const owSubject = Math.min(grossWage, OW_CEILING);
  const employeeOW = Math.round(owSubject * row.employee_rate * 100) / 100;
  const employerOW = Math.round(owSubject * row.employer_rate * 100) / 100;
  const totalOW = Math.round((employeeOW + employerOW) * 100) / 100;

  // AW (bonus) subject to CPF
  const totalOWForYear = owSubject * monthsWorked;
  const awCeiling = Math.max(0, AW_ANNUAL_CEILING - totalOWForYear);
  const awSubject = Math.min(bonusAmount, awCeiling);
  const employeeAW = Math.round(awSubject * row.employee_rate * 100) / 100;
  const employerAW = Math.round(awSubject * row.employer_rate * 100) / 100;
  const totalAW = Math.round((employeeAW + employerAW) * 100) / 100;

  // Allocation breakdown (monthly OW only)
  const oaAmount = Math.round(totalOW * row.oa_allocation * 100) / 100;
  const saAmount = Math.round(totalOW * row.sa_allocation * 100) / 100;
  const maAmount = Math.round((totalOW - oaAmount - saAmount) * 100) / 100;

  // SDL
  const sdlBase = grossWage + bonusAmount;
  const sdlRaw = sdlBase * SDL_RATE;
  const sdl = sdlBase > 0 ? Math.min(SDL_MAX, Math.max(SDL_MIN, Math.round(sdlRaw * 100) / 100)) : 0;

  const takeHome = Math.round((grossWage - employeeOW) * 100) / 100;
  const totalEmployerCost = Math.round((grossWage + employerOW + sdl) * 100) / 100;

  return {
    input: { gross_monthly_wage: grossWage, age, citizenship, bonus_amount: bonusAmount, months_worked_this_year: monthsWorked },
    cpf_rates: { age_band: row.age_band, employee_rate: `${(row.employee_rate * 100).toFixed(1)}%`, employer_rate: `${(row.employer_rate * 100).toFixed(1)}%`, total_rate: `${(row.total_rate * 100).toFixed(1)}%` },
    monthly_contributions: {
      ordinary_wages_subject: owSubject,
      employee_cpf: employeeOW,
      employer_cpf: employerOW,
      total_cpf: totalOW,
    },
    bonus_contributions: bonusAmount > 0 ? {
      bonus_amount: bonusAmount,
      aw_ceiling_remaining: awCeiling,
      aw_subject_to_cpf: awSubject,
      employee_cpf: employeeAW,
      employer_cpf: employerAW,
      total_cpf: totalAW,
    } : null,
    account_allocation: {
      ordinary_account: oaAmount,
      special_account: saAmount,
      medisave_account: maAmount,
      oa_percentage: `${(row.oa_allocation * 100).toFixed(1)}%`,
      sa_percentage: `${(row.sa_allocation * 100).toFixed(1)}%`,
      ma_percentage: `${(row.ma_allocation * 100).toFixed(1)}%`,
    },
    take_home_pay: takeHome,
    employer_total_cost: { gross_wage: grossWage, employer_cpf: employerOW, sdl, total: totalEmployerCost },
    effective_date: "2026-01-01",
    ow_ceiling: OW_CEILING,
    notes: grossWage > OW_CEILING ? `Gross wage $${grossWage} exceeds OW ceiling of $${OW_CEILING}. CPF calculated on $${OW_CEILING}.` : null,
    summary: `CPF for $${grossWage}/month (age ${age}, ${citizenship}): Employee $${employeeOW}, Employer $${employerOW}. Take-home: $${takeHome}. Total employer cost: $${totalEmployerCost}.`,
  };
}

function getCpfRates(args: Record<string, unknown>) {
  const citizenship = (args.citizenship as CitizenshipStatus) || "citizen";
  const table = RATE_TABLES[citizenship];
  if (!table) {
    return { error: "Invalid citizenship status", summary: "Unrecognized citizenship status." };
  }

  const rates = table.map((r) => ({
    age_band: r.age_band,
    employee_rate: `${(r.employee_rate * 100).toFixed(1)}%`,
    employer_rate: `${(r.employer_rate * 100).toFixed(1)}%`,
    total_rate: `${(r.total_rate * 100).toFixed(1)}%`,
    oa_allocation: `${(r.oa_allocation * 100).toFixed(1)}%`,
    sa_allocation: `${(r.sa_allocation * 100).toFixed(1)}%`,
    ma_allocation: `${(r.ma_allocation * 100).toFixed(1)}%`,
  }));

  return {
    citizenship_status: citizenship,
    effective_date: "2026-01-01",
    ow_ceiling_monthly: OW_CEILING,
    aw_ceiling_annual: AW_ANNUAL_CEILING,
    rates,
    summary: `CPF rates for ${citizenship}: ${rates.length} age bands. OW ceiling: $${OW_CEILING}/month.`,
  };
}

function calculateTakeHome(args: Record<string, unknown>) {
  const grossWage = Number(args.gross_monthly_wage) || 0;
  const age = Number(args.age) || 30;
  const citizenship = (args.citizenship as CitizenshipStatus) || "citizen";

  const row = findRateRow(age, citizenship);
  if (!row) {
    return { error: "Invalid parameters", summary: "Could not find CPF rates." };
  }

  const owSubject = Math.min(grossWage, OW_CEILING);
  const employeeCpf = Math.round(owSubject * row.employee_rate * 100) / 100;
  const takeHome = Math.round((grossWage - employeeCpf) * 100) / 100;
  const effectiveTaxRate = grossWage > 0 ? `${((employeeCpf / grossWage) * 100).toFixed(1)}%` : "0%";

  return {
    gross_monthly_wage: grossWage,
    employee_cpf_deduction: employeeCpf,
    take_home_pay: takeHome,
    effective_cpf_rate: effectiveTaxRate,
    age,
    citizenship,
    ow_ceiling_applied: grossWage > OW_CEILING,
    summary: `Take-home pay: $${takeHome}/month (after $${employeeCpf} CPF deduction from $${grossWage} gross).`,
  };
}

function getCpfCeilings(args: Record<string, unknown>) {
  const monthsWorked = Number(args.months_worked_this_year) || 12;
  const monthlyOW = Number(args.monthly_ordinary_wage) || 0;

  const totalOWForYear = Math.min(monthlyOW, OW_CEILING) * monthsWorked;
  const awCeilingRemaining = Math.max(0, AW_ANNUAL_CEILING - totalOWForYear);

  return {
    ow_ceiling_monthly: OW_CEILING,
    ow_ceiling_note: "Maximum Ordinary Wages subject to CPF per month",
    aw_ceiling_annual: AW_ANNUAL_CEILING,
    aw_ceiling_note: "Annual limit: $102,000 minus total OW subject to CPF for the year",
    calculated: monthlyOW > 0 ? {
      monthly_ow: monthlyOW,
      months_worked: monthsWorked,
      total_ow_for_year: totalOWForYear,
      aw_ceiling_remaining: awCeilingRemaining,
    } : null,
    sdl: {
      rate: `${SDL_RATE * 100}%`,
      minimum: SDL_MIN,
      maximum: SDL_MAX,
      note: "Skills Development Levy payable by employer on all employees",
    },
    effective_date: "2026-01-01",
    summary: `OW ceiling: $${OW_CEILING}/month. AW ceiling: $${AW_ANNUAL_CEILING}/year.${monthlyOW > 0 ? ` AW ceiling remaining: $${awCeilingRemaining}.` : ""}`,
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS: ToolDefinition[] = [
  {
    name: "calculate_cpf",
    description: "Calculate Singapore CPF contributions for an employee given salary, age, and citizenship status. Returns employee/employer contributions, account allocations (OA/SA/MA), take-home pay, and total employer cost. Use this tool when you need to compute CPF for payroll, hiring cost analysis, or compensation planning in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        gross_monthly_wage: { type: "number", description: "Gross monthly ordinary wage in SGD." },
        age: { type: "number", description: "Employee age in years." },
        citizenship: { type: "string", description: "Citizenship status: citizen, spr_1st_year, spr_2nd_year, or spr_3rd_year_onwards. Defaults to citizen." },
        bonus_amount: { type: "number", description: "Additional/bonus wage amount in SGD (optional). Subject to AW ceiling." },
        months_worked_this_year: { type: "number", description: "Months worked this calendar year (1-12). Used for AW ceiling calculation. Defaults to 12." },
      },
      required: ["gross_monthly_wage", "age"],
    },
  },
  {
    name: "get_cpf_rates",
    description: "Get Singapore CPF contribution rate tables by citizenship status. Returns all age band rates with employee/employer percentages and OA/SA/MA allocation splits. Use this tool when you need to look up CPF rate schedules for workforce planning or compliance documentation.",
    inputSchema: {
      type: "object",
      properties: {
        citizenship: { type: "string", description: "Citizenship status: citizen, spr_1st_year, spr_2nd_year, or spr_3rd_year_onwards. Defaults to citizen." },
      },
    },
  },
  {
    name: "calculate_take_home",
    description: "Calculate net take-home pay after CPF deduction for a Singapore employee. Use this tool when you need a quick salary-to-take-home conversion for job offers, salary negotiations, or budgeting.",
    inputSchema: {
      type: "object",
      properties: {
        gross_monthly_wage: { type: "number", description: "Gross monthly wage in SGD." },
        age: { type: "number", description: "Employee age in years." },
        citizenship: { type: "string", description: "Citizenship status: citizen, spr_1st_year, spr_2nd_year, or spr_3rd_year_onwards. Defaults to citizen." },
      },
      required: ["gross_monthly_wage", "age"],
    },
  },
  {
    name: "get_cpf_ceilings",
    description: "Get current CPF wage ceilings (OW monthly ceiling, AW annual ceiling) and Skills Development Levy rates. Optionally calculate remaining AW ceiling for a given employee. Use this tool when you need to check CPF contribution limits or SDL obligations.",
    inputSchema: {
      type: "object",
      properties: {
        monthly_ordinary_wage: { type: "number", description: "Employee monthly ordinary wage in SGD (optional). If provided, calculates remaining AW ceiling." },
        months_worked_this_year: { type: "number", description: "Months worked this calendar year (optional). Defaults to 12." },
      },
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
      "asean-trade-rules": "https://asean-trade-rules-mcp.sgdata.workers.dev",
      "sg-workpass-compass": "https://sg-workpass-compass-mcp.sgdata.workers.dev",
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
    case "calculate_cpf": { const r = calculateCpf(args); return { data: r, summary: r.summary }; }
    case "get_cpf_rates": { const r = getCpfRates(args); return { data: r, summary: r.summary }; }
    case "calculate_take_home": { const r = calculateTakeHome(args); return { data: r, summary: r.summary }; }
    case "get_cpf_ceilings": { const r = getCpfCeilings(args); return { data: r, summary: r.summary }; }
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
    reportTelemetry(ctx, toolName, true, Date.now() - startTime, 200);
    return { response: jsonRpcSuccess(id, { content: [{ type: "text", text: JSON.stringify({ data, meta: buildMeta(tier, callsRemaining) }, null, 2) }], _meta: { summary } }), status: 200 };
  } catch (error) {
    reportTelemetry(ctx, toolName, false, Date.now() - startTime, 500);
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
    description: "MCP server for Singapore CPF contribution calculations. Computes employee/employer contributions, OA/SA/MA allocations, take-home pay, and employer cost including SDL. Covers citizens, SPR 1st/2nd/3rd year rates.",
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
    description: "Singapore CPF Calculator MCP Server — Compute CPF contributions, take-home pay, employer costs, and account allocations for AI agents.",
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
