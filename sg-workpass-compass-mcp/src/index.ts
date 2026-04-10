// ---------------------------------------------------------------------------
// sg-workpass-compass-mcp — Singapore COMPASS & Work Pass Eligibility MCP Server
// ---------------------------------------------------------------------------

interface Env { RATE_LIMIT: KVNamespace; API_KEYS: KVNamespace; }
interface JsonRpcRequest { jsonrpc: "2.0"; id: string | number | null; method: string; params?: Record<string, unknown>; }
interface JsonRpcResponse { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown }; }
interface ResponseMeta { tier: "free" | "paid"; calls_remaining_today: number; timestamp: string; source: string; version: string; upgrade_url: string; pricing: { starter: string; pro: string; enterprise: string }; related_tools: Record<string, string>; trust_score_url: string; observatory: string; }
interface ToolDefinition { name: string; description: string; inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] }; }

const SERVICE_NAME = "sg-workpass-compass-mcp";
const SERVICE_VERSION = "1.1.0";
const UPGRADE_URL = "https://daee-sg-workpass.vercel.app";
const FREE_TIER_DAILY_LIMIT = 5;
const FREE_TIER_DELAY_MS = 3000;

// ---------------------------------------------------------------------------
// Observatory Integration (DAEE Phase 3.5 — MANDATORY)
// ---------------------------------------------------------------------------

const OBSERVATORY_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const SELF_URL = "https://sg-workpass-compass-mcp.sgdata.workers.dev/mcp";

function reportToObservatory(
  ctx: ExecutionContext,
  toolName: string,
  success: boolean,
  latencyMs: number,
  httpStatus: number
): void {
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
            server_url: SELF_URL,
            success,
            latency_ms: latencyMs,
            tool_name: toolName,
            http_status: httpStatus,
          },
        },
      }),
    }).catch(() => {}) // silent fail — never block main response
  );
}

// ---------------------------------------------------------------------------
// COMPASS Data (effective Jan 2026)
// ---------------------------------------------------------------------------

interface SectorBenchmark {
  sector: string;
  median_salary: number;
  p65_salary: number;
  local_pmet_25th: number;
  local_pmet_50th: number;
}

const SECTOR_BENCHMARKS: SectorBenchmark[] = [
  { sector: "financial_services", median_salary: 5800, p65_salary: 8500, local_pmet_25th: 60, local_pmet_50th: 75 },
  { sector: "technology", median_salary: 5600, p65_salary: 8000, local_pmet_25th: 55, local_pmet_50th: 70 },
  { sector: "manufacturing", median_salary: 5000, p65_salary: 7200, local_pmet_25th: 65, local_pmet_50th: 80 },
  { sector: "professional_services", median_salary: 5400, p65_salary: 7800, local_pmet_25th: 60, local_pmet_50th: 75 },
  { sector: "all_others", median_salary: 5600, p65_salary: 8000, local_pmet_25th: 55, local_pmet_50th: 70 },
];

function getSectorBenchmark(sector?: string): SectorBenchmark {
  const s = sector?.toLowerCase().replace(/[\s-]/g, "_") || "all_others";
  return SECTOR_BENCHMARKS.find(b => b.sector === s || b.sector.includes(s) || s.includes(b.sector)) || SECTOR_BENCHMARKS[4];
}

// EP qualifying salaries
const EP_BASE_GENERAL = 5600;
const EP_BASE_FS = 6200;
const COMPASS_EXEMPT_SALARY = 22500;

// S Pass
const SPASS_BASE_SALARY = 3150;
const SPASS_LEVY_MONTHLY = 650;

interface SpassDrc { sector: string; drc_percent: number; notes: string; }
const SPASS_DRC: SpassDrc[] = [
  { sector: "services", drc_percent: 10, notes: "Up to 10% of total workforce" },
  { sector: "manufacturing", drc_percent: 18, notes: "Up to 18% of total workforce" },
  { sector: "construction", drc_percent: 18, notes: "Up to 18% of total workforce" },
  { sector: "marine_shipyard", drc_percent: 18, notes: "Up to 18% of total workforce" },
  { sector: "process", drc_percent: 18, notes: "Up to 18% of total workforce" },
];

// Work Permit
interface WpSector { sector: string; drc_percent: number; tier1_levy: number; tier2_levy: number; notes: string; }
const WP_SECTORS: WpSector[] = [
  { sector: "manufacturing", drc_percent: 60, tier1_levy: 300, tier2_levy: 600, notes: "Higher-skilled (R1) workers attract Tier 1 rates" },
  { sector: "services", drc_percent: 35, tier1_levy: 300, tier2_levy: 600, notes: "Most restrictive DRC among sectors" },
  { sector: "construction", drc_percent: 87.5, tier1_levy: 300, tier2_levy: 700, notes: "MYE system applies; highest DRC" },
  { sector: "marine_shipyard", drc_percent: 87.5, tier1_levy: 300, tier2_levy: 700, notes: "Similar to construction" },
  { sector: "process", drc_percent: 87.5, tier1_levy: 300, tier2_levy: 700, notes: "Covers oil, gas, petrochemical" },
];

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function calculateCompassScore(args: Record<string, unknown>) {
  const salary = Number(args.salary) || 0;
  const sector = args.sector as string | undefined;
  const qualLevel = (args.qualification_level as string) || "degree";
  const natPct = args.nationality_pct_of_firm_pmets !== undefined ? Number(args.nationality_pct_of_firm_pmets) : undefined;
  const firmLocalPct = args.firm_local_pmet_pct !== undefined ? Number(args.firm_local_pmet_pct) : undefined;
  const onShortage = args.on_shortage_list === true;
  const strategicScheme = args.strategic_scheme === true;

  const bench = getSectorBenchmark(sector);

  // C1: Salary
  let c1 = 0;
  if (salary >= bench.p65_salary) c1 = 20;
  else if (salary >= bench.median_salary) c1 = 10;

  // C2: Qualifications
  let c2 = 0;
  if (qualLevel === "top_tier") c2 = 20;
  else if (qualLevel === "degree") c2 = 10;

  // C3: Diversity
  let c3 = 0;
  if (natPct !== undefined) {
    if (natPct < 5) c3 = 20;
    else if (natPct < 25) c3 = 10;
  }

  // C4: Support for local employment
  let c4 = 0;
  if (firmLocalPct !== undefined) {
    if (firmLocalPct >= bench.local_pmet_50th) c4 = 20;
    else if (firmLocalPct >= bench.local_pmet_25th) c4 = 10;
  }

  // C5: Bonus - Skills shortage
  const c5 = onShortage ? 20 : 0;

  // C6: Bonus - Strategic economic priorities
  const c6 = strategicScheme ? 20 : 0;

  const foundationalScore = c1 + c2 + c3 + c4;
  const bonusScore = c5 + c6;
  const totalScore = foundationalScore + bonusScore;
  const passes = foundationalScore >= 40;

  return {
    compass_scores: {
      c1_salary: { points: c1, benchmark_used: bench.sector, median: bench.median_salary, p65: bench.p65_salary, candidate_salary: salary },
      c2_qualifications: { points: c2, level: qualLevel },
      c3_diversity: { points: c3, nationality_pct: natPct ?? "not provided" },
      c4_local_employment: { points: c4, firm_local_pmet_pct: firmLocalPct ?? "not provided", sector_25th: bench.local_pmet_25th, sector_50th: bench.local_pmet_50th },
      c5_skills_bonus: { points: c5, on_shortage_list: onShortage },
      c6_strategic_bonus: { points: c6, strategic_scheme: strategicScheme },
    },
    foundational_score: foundationalScore,
    bonus_score: bonusScore,
    total_score: totalScore,
    pass_threshold: 40,
    passes,
    effective_date: "2026-01-01",
    summary: `COMPASS score: ${totalScore} (foundational: ${foundationalScore}, bonus: ${bonusScore}). ${passes ? "PASSES" : "DOES NOT PASS"} threshold of 40. C1=${c1}, C2=${c2}, C3=${c3}, C4=${c4}, C5=${c5}, C6=${c6}.`,
  };
}

function checkEpEligibility(args: Record<string, unknown>) {
  const salary = Number(args.salary) || 0;
  const sector = (args.sector as string) || "general";
  const age = Number(args.age) || 23;
  const isCompassExempt = args.is_compass_exempt === true;

  const isFS = sector.toLowerCase().includes("financial");
  const baseSalary = isFS ? EP_BASE_FS : EP_BASE_GENERAL;
  const yearsAbove23 = Math.max(0, Math.min(age - 23, 22));
  const ageAdjusted = baseSalary + yearsAbove23 * 200;

  const meetsSalary = salary >= ageAdjusted;
  const compassExempt = isCompassExempt || salary >= COMPASS_EXEMPT_SALARY;

  return {
    eligibility: {
      meets_minimum_salary: meetsSalary,
      compass_exempt: compassExempt,
      compass_required: !compassExempt,
      overall: meetsSalary ? (compassExempt ? "ELIGIBLE (COMPASS-exempt)" : "SALARY ELIGIBLE — must pass COMPASS") : "NOT ELIGIBLE — salary below threshold",
    },
    salary_details: {
      candidate_salary: salary,
      base_qualifying_salary: baseSalary,
      age_adjusted_salary: ageAdjusted,
      age,
      age_adjustment: yearsAbove23 > 0 ? `+$${yearsAbove23 * 200} (${yearsAbove23} years above 23)` : "None",
      sector: isFS ? "financial_services" : "general",
      compass_exempt_threshold: COMPASS_EXEMPT_SALARY,
    },
    effective_date: "2026-01-01",
    summary: `EP eligibility for $${salary}/month (age ${age}, ${isFS ? "financial services" : "general"}): ${meetsSalary ? "Meets" : "Does NOT meet"} salary threshold of $${ageAdjusted}. ${compassExempt ? "COMPASS-exempt." : "Must pass COMPASS."}`,
  };
}

function getSpassQuota(args: Record<string, unknown>) {
  const sector = (args.sector as string) || "services";
  const totalWorkforce = Number(args.total_workforce) || 0;
  const currentSpass = Number(args.current_spass_count) || 0;
  const proposedSalary = Number(args.proposed_salary) || 0;
  const applicantAge = Number(args.applicant_age) || 25;

  const s = sector.toLowerCase().replace(/[\s-]/g, "_");
  const drc = SPASS_DRC.find(d => d.sector === s || d.sector.includes(s) || s.includes(d.sector)) || SPASS_DRC[0];
  const maxSpass = Math.floor(totalWorkforce * drc.drc_percent / 100);
  const slotsAvailable = Math.max(0, maxSpass - currentSpass);

  // Age-adjusted S Pass salary
  const yearsAbove23 = Math.max(0, Math.min(applicantAge - 23, 22));
  const ageAdjustedSalary = SPASS_BASE_SALARY + yearsAbove23 * 75;
  const meetsSalary = proposedSalary >= ageAdjustedSalary;

  const monthlyLevyCost = (currentSpass + 1) * SPASS_LEVY_MONTHLY;

  return {
    quota: {
      sector: drc.sector,
      drc_percent: drc.drc_percent,
      total_workforce: totalWorkforce,
      max_spass_allowed: maxSpass,
      current_spass: currentSpass,
      slots_available: slotsAvailable,
      has_quota: slotsAvailable > 0,
    },
    salary_check: proposedSalary > 0 ? {
      proposed_salary: proposedSalary,
      minimum_qualifying_salary: ageAdjustedSalary,
      base_salary: SPASS_BASE_SALARY,
      age_adjustment: yearsAbove23 > 0 ? `+$${yearsAbove23 * 75} for age ${applicantAge}` : "None",
      meets_salary: meetsSalary,
    } : null,
    levy: {
      monthly_per_holder: SPASS_LEVY_MONTHLY,
      total_monthly_levy_after_hire: monthlyLevyCost,
      annual_levy_after_hire: monthlyLevyCost * 12,
    },
    effective_date: "2026-01-01",
    summary: `S Pass quota (${drc.sector}): ${slotsAvailable} slots available (${currentSpass}/${maxSpass} used, ${drc.drc_percent}% DRC). ${proposedSalary > 0 ? (meetsSalary ? `Salary $${proposedSalary} meets minimum $${ageAdjustedSalary}.` : `Salary $${proposedSalary} below minimum $${ageAdjustedSalary}.`) : ""} Levy: $${SPASS_LEVY_MONTHLY}/month per holder.`,
  };
}

function getWorkPermitQuota(args: Record<string, unknown>) {
  const sector = (args.sector as string) || "manufacturing";
  const localEmployees = Number(args.local_employees) || 0;
  const currentWp = Number(args.current_wp_count) || 0;

  const s = sector.toLowerCase().replace(/[\s-]/g, "_");
  const wp = WP_SECTORS.find(w => w.sector === s || w.sector.includes(s) || s.includes(w.sector)) || WP_SECTORS[0];

  // WP quota based on local employee count
  const totalWithWp = localEmployees + currentWp;
  const maxWpPct = wp.drc_percent / 100;
  const maxWp = totalWithWp > 0 ? Math.floor(totalWithWp * maxWpPct / (1 - maxWpPct + 0.001)) : 0;
  const slotsAvailable = Math.max(0, maxWp - currentWp);

  // Levy tiers
  const tier1Count = Math.min(currentWp + 1, Math.ceil(maxWp * 0.5));
  const tier2Count = Math.max(0, (currentWp + 1) - tier1Count);
  const monthlyLevy = tier1Count * wp.tier1_levy + tier2Count * wp.tier2_levy;

  return {
    quota: {
      sector: wp.sector,
      drc_percent: wp.drc_percent,
      local_employees: localEmployees,
      current_wp: currentWp,
      estimated_max_wp: maxWp,
      slots_available: slotsAvailable,
      has_quota: slotsAvailable > 0,
    },
    levy: {
      tier1_levy: wp.tier1_levy,
      tier2_levy: wp.tier2_levy,
      estimated_monthly_levy_total: monthlyLevy,
      estimated_annual_levy_total: monthlyLevy * 12,
      notes: wp.notes,
    },
    effective_date: "2026-01-01",
    summary: `WP quota (${wp.sector}): ${slotsAvailable} slots available (${currentWp}/${maxWp} estimated max, ${wp.drc_percent}% DRC). Levy: Tier 1 $${wp.tier1_levy}, Tier 2 $${wp.tier2_levy}/month.`,
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS: ToolDefinition[] = [
  {
    name: "calculate_compass_score",
    description: "Calculate COMPASS (Complementarity Assessment Framework) score for a Singapore Employment Pass application. Evaluates all 6 criteria: salary vs sector benchmarks, qualifications, workforce diversity, local employment support, skills shortage bonus, and strategic priorities bonus. Use this tool when you need to assess whether a candidate will pass COMPASS for an EP application in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        salary: { type: "number", description: "Candidate monthly salary in SGD." },
        sector: { type: "string", description: "Sector: financial_services, technology, manufacturing, professional_services, or all_others." },
        qualification_level: { type: "string", description: "Qualification: top_tier (COMPASS institution list), degree, or below_degree. Defaults to degree." },
        nationality_pct_of_firm_pmets: { type: "number", description: "Candidate nationality as % of firm PMETs (0-100). For C3 diversity scoring." },
        firm_local_pmet_pct: { type: "number", description: "Firm local PMET percentage (0-100). For C4 local employment scoring." },
        on_shortage_list: { type: "boolean", description: "Is the occupation on MOM Shortage Occupation List? For C5 bonus." },
        strategic_scheme: { type: "boolean", description: "Does this qualify under EDB/MTI strategic economic scheme? For C6 bonus." },
      },
      required: ["salary"],
    },
  },
  {
    name: "check_ep_eligibility",
    description: "Check Singapore Employment Pass eligibility by verifying minimum qualifying salary (age-adjusted) and COMPASS requirements. Returns whether the candidate meets salary thresholds and whether COMPASS scoring is required or exempt. Use this tool when you need to verify if a foreign professional qualifies for an EP in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        salary: { type: "number", description: "Candidate monthly salary in SGD." },
        sector: { type: "string", description: "Sector: general or financial_services. Financial services has higher thresholds." },
        age: { type: "number", description: "Candidate age. Salary threshold increases $200/year above age 23. Defaults to 23." },
        is_compass_exempt: { type: "boolean", description: "Override COMPASS exemption check (e.g. for intra-corporate transferees)." },
      },
      required: ["salary"],
    },
  },
  {
    name: "get_spass_quota",
    description: "Get S Pass quota availability, levy rates, and salary requirements for a Singapore company. Calculates remaining S Pass slots based on sector DRC and current workforce composition. Use this tool when you need to check if a company can hire an S Pass holder and the associated costs.",
    inputSchema: {
      type: "object",
      properties: {
        sector: { type: "string", description: "Sector: services, manufacturing, construction, marine_shipyard, process." },
        total_workforce: { type: "number", description: "Total company workforce (local + foreign)." },
        current_spass_count: { type: "number", description: "Current number of S Pass holders in the company." },
        proposed_salary: { type: "number", description: "Proposed S Pass holder salary in SGD (optional, for eligibility check)." },
        applicant_age: { type: "number", description: "Applicant age for age-adjusted salary check. Defaults to 25." },
      },
      required: ["sector", "total_workforce"],
    },
  },
  {
    name: "get_work_permit_quota",
    description: "Get Work Permit quota availability and levy rates by sector for a Singapore company. Calculates remaining WP slots based on dependency ratio ceiling and current workforce. Use this tool when you need to check if a company can hire Work Permit holders and the associated levy costs.",
    inputSchema: {
      type: "object",
      properties: {
        sector: { type: "string", description: "Sector: manufacturing, services, construction, marine_shipyard, process." },
        local_employees: { type: "number", description: "Number of local employees (citizens + PRs)." },
        current_wp_count: { type: "number", description: "Current number of Work Permit holders." },
      },
      required: ["sector", "local_employees"],
    },
  },
];

// ---------------------------------------------------------------------------
// MCP infrastructure
// ---------------------------------------------------------------------------

function buildMeta(tier: "free" | "paid", callsRemainingToday: number): ResponseMeta {
  return {
    tier, calls_remaining_today: callsRemainingToday, timestamp: new Date().toISOString(), source: SERVICE_NAME, version: SERVICE_VERSION, upgrade_url: UPGRADE_URL,
    pricing: { starter: "$29/month - 1,000 calls/month", pro: "$99/month - 10,000 calls/month", enterprise: "$299/month - unlimited calls" },
    related_tools: {
      "sg-regulatory-data": "https://sg-regulatory-data-mcp.sgdata.workers.dev",
      "sg-company-lookup": "https://sg-company-lookup-mcp.sgdata.workers.dev",
      "sg-cpf-calculator": "https://sg-cpf-calculator-mcp.sgdata.workers.dev",
      "asean-trade-rules": "https://asean-trade-rules-mcp.sgdata.workers.dev",
    },
    trust_score_url: `https://dominion-observatory.sgdata.workers.dev/api/trust?url=${encodeURIComponent(SELF_URL)}`,
    observatory: "https://dominion-observatory.sgdata.workers.dev",
  };
}

function getTodayKey(ip: string): string { return `rate:${SERVICE_NAME}:${ip}:${new Date().toISOString().split("T")[0]}`; }

async function checkRateLimit(env: Env, ip: string): Promise<{ allowed: boolean; callsUsed: number; callsRemaining: number }> {
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
function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", ...headers } });
}

function executeTool(name: string, args: Record<string, unknown>): { data: unknown; summary: string } {
  switch (name) {
    case "calculate_compass_score": { const r = calculateCompassScore(args); return { data: r, summary: r.summary }; }
    case "check_ep_eligibility": { const r = checkEpEligibility(args); return { data: r, summary: r.summary }; }
    case "get_spass_quota": { const r = getSpassQuota(args); return { data: r, summary: r.summary }; }
    case "get_work_permit_quota": { const r = getWorkPermitQuota(args); return { data: r, summary: r.summary }; }
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

function handleInitialize(id: string | number | null): JsonRpcResponse {
  return jsonRpcSuccess(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: SERVICE_NAME, version: SERVICE_VERSION } });
}

async function handleToolCall(id: string | number | null, params: Record<string, unknown>, env: Env, request: Request, ctx: ExecutionContext): Promise<{ response: JsonRpcResponse; status: number }> {
  const toolName = params.name as string; const toolArgs = (params.arguments as Record<string, unknown>) || {};
  if (!toolName) return { response: jsonRpcError(id, -32602, "Missing tool name"), status: 400 };
  if (!TOOLS.some(t => t.name === toolName)) return { response: jsonRpcError(id, -32602, `Unknown tool: ${toolName}`), status: 400 };

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

  const startTime = Date.now();
  try {
    const { data, summary } = executeTool(toolName, toolArgs);
    reportToObservatory(ctx, toolName, true, Date.now() - startTime, 200);
    return { response: jsonRpcSuccess(id, { content: [{ type: "text", text: JSON.stringify({ data, meta: buildMeta(tier, callsRemaining) }, null, 2) }], _meta: { summary } }), status: 200 };
  } catch (error) {
    reportToObservatory(ctx, toolName, false, Date.now() - startTime, 500);
    return { response: jsonRpcError(id, -32603, error instanceof Error ? error.message : String(error), { meta: buildMeta(tier, callsRemaining) }), status: 500 };
  }
}

function handleHealth(): Response { return jsonResponse({ status: "ok", service: SERVICE_NAME, version: SERVICE_VERSION, timestamp: new Date().toISOString() }); }

function handleDiscovery(): Response {
  return jsonResponse({
    name: SERVICE_NAME, version: SERVICE_VERSION,
    description: "MCP server for Singapore COMPASS scoring, Employment Pass eligibility, S Pass quotas, and Work Permit levy calculations. Use for hiring foreign talent in Singapore.",
    protocol: "mcp", protocol_version: "2024-11-05", endpoint: "/mcp",
    capabilities: { tools: TOOLS.map(t => ({ name: t.name, description: t.description })) },
    authentication: { type: "bearer", description: "Bearer token for paid tier. Free tier: 5 calls/day with 3s delay." },
    pricing: { free: "5 calls/day, 3s delay", starter: "$29/month - 1,000 calls", pro: "$99/month - 10,000 calls", enterprise: "$299/month - unlimited" },
    upgrade_url: UPGRADE_URL,
  });
}

function handleIndex(): Response {
  return jsonResponse({
    service: SERVICE_NAME, version: SERVICE_VERSION,
    description: "Singapore Work Pass & COMPASS MCP Server — COMPASS scoring, EP eligibility, S Pass quotas, WP levy calculations for AI agents.",
    endpoints: { "GET /": "Info", "GET /health": "Health", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" },
    tools: TOOLS.map(t => t.name), documentation: UPGRADE_URL,
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
    case "tools/list": return jsonResponse(jsonRpcSuccess(id, { tools: TOOLS }));
    case "tools/call": { const { response, status } = await handleToolCall(id, (body.params || {}) as Record<string, unknown>, env, request, ctx); return jsonResponse(response, status); }
    default: return jsonResponse(jsonRpcError(id, -32601, `Method not found: ${body.method}`), 400);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" } });
      const path = new URL(request.url).pathname;
      if (request.method === "GET" && path === "/health") return handleHealth();
      if (request.method === "GET" && path === "/.well-known/mcp.json") return handleDiscovery();
      if (request.method === "POST" && path === "/mcp") return await handleMcp(request, env, ctx);
      if (request.method === "GET" && path === "/") return handleIndex();
      return jsonResponse({ error: "Not found", available_endpoints: ["/", "/health", "/.well-known/mcp.json", "/mcp"] }, 404);
    } catch (error) { return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error), service: SERVICE_NAME, timestamp: new Date().toISOString() }, 500); }
  },
};
