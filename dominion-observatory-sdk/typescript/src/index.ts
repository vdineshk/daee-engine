/**
 * Dominion Observatory SDK (TypeScript)
 *
 * Two functions:
 *   - report(args): send anonymized interaction telemetry to the Observatory
 *   - checkTrust(serverUrl): fetch a server's behavioral trust score
 *
 * Privacy: reports carry ONLY
 *   {agent_id, server_url, success, latency_ms, tool_name, http_status}.
 * No query content, user data, prompts, or IP addresses are collected.
 *
 * About agent_id (REQUIRED as of 0.2.0):
 *   - Identifies which agent/app is reporting, so the Observatory can tell
 *     cross-ecosystem external telemetry apart from internal probes and
 *     synthetic test traffic.
 *   - Must be a stable, non-empty string. A random UUID, an npm package name,
 *     or any opaque identifier you control all work.
 *   - Do NOT use "anonymous" or "observatory_probe"; those values are
 *     reserved for internal classification and will be filtered out of
 *     cross-ecosystem external statistics.
 *
 * Use it from any MCP server, LangChain tool, AutoGen agent, or CrewAI worker to
 * contribute to — and read from — the cross-ecosystem agent behavioral trust network.
 */

const OBSERVATORY_MCP_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const OBSERVATORY_API_URL = "https://dominion-observatory.sgdata.workers.dev/api";

const RESERVED_AGENT_IDS = new Set(["anonymous", "observatory_probe", ""]);

export interface ReportArgs {
  /**
   * REQUIRED. Stable identifier for the agent/app sending the report.
   * Must not be empty, "anonymous", or "observatory_probe".
   */
  agent_id: string;
  /** Canonical URL of the MCP server the interaction happened on. */
  server_url: string;
  /** True if the tool call returned a non-error result. */
  success: boolean;
  /** End-to-end latency of the tool call, in milliseconds. */
  latency_ms: number;
  /** Name of the tool that was called. */
  tool_name: string;
  /** Optional HTTP status code returned to the caller. */
  http_status?: number;
}

export interface TrustScore {
  found: boolean;
  server_url: string;
  name?: string;
  category?: string;
  trust_score?: number;
  static_score?: number;
  runtime_score?: number;
  metrics?: {
    total_calls: number;
    success_rate: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    uptime_30d: number;
  };
  recent_7d?: {
    interactions: number;
    avg_latency_ms: number;
  };
}

export interface ReportOptions {
  /** Override the Observatory MCP endpoint (mostly for testing). */
  endpoint?: string;
  /** Fetch implementation, defaults to global fetch. */
  fetch?: typeof fetch;
  /** Request timeout in milliseconds. Default: 2000. */
  timeoutMs?: number;
}

function validateAgentId(agent_id: unknown): string {
  if (typeof agent_id !== "string") {
    throw new TypeError(
      "dominion-observatory-sdk: agent_id is required and must be a string. " +
        "See https://dominion-observatory.sgdata.workers.dev for docs."
    );
  }
  const trimmed = agent_id.trim();
  if (RESERVED_AGENT_IDS.has(trimmed)) {
    throw new Error(
      `dominion-observatory-sdk: agent_id "${trimmed}" is reserved or empty. ` +
        "Pass a stable non-empty identifier (e.g. your package name or a UUID)."
    );
  }
  return trimmed;
}

/**
 * Fire-and-forget telemetry report. Throws synchronously ONLY on invalid agent_id.
 * Otherwise the returned Promise resolves to true on HTTP 2xx, false otherwise
 * and never rejects — safe to ignore.
 */
export async function report(
  args: ReportArgs,
  options: ReportOptions = {}
): Promise<boolean> {
  const agent_id = validateAgentId(args.agent_id);

  const endpoint = options.endpoint ?? OBSERVATORY_MCP_URL;
  const fetchImpl = options.fetch ?? (globalThis as any).fetch;
  const timeoutMs = options.timeoutMs ?? 2000;

  if (!fetchImpl) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "report_interaction",
          arguments: {
            agent_id,
            server_url: args.server_url,
            success: args.success,
            latency_ms: Math.max(0, Math.round(args.latency_ms)),
            tool_name: args.tool_name,
            http_status: args.http_status ?? (args.success ? 200 : 500),
          },
        },
      }),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a server's current trust score from the Observatory.
 * Returns {found: false, server_url} if the Observatory has no record of the server.
 */
export async function checkTrust(
  serverUrl: string,
  options: ReportOptions = {}
): Promise<TrustScore> {
  const endpoint = options.endpoint ?? OBSERVATORY_API_URL;
  const fetchImpl = options.fetch ?? (globalThis as any).fetch;
  const timeoutMs = options.timeoutMs ?? 3000;

  if (!fetchImpl) return { found: false, server_url: serverUrl };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${endpoint}/trust?url=${encodeURIComponent(serverUrl)}`;
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) return { found: false, server_url: serverUrl };
    return (await res.json()) as TrustScore;
  } catch {
    return { found: false, server_url: serverUrl };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Convenience wrapper that measures latency and reports it.
 * Use it to instrument a single tool handler with one line.
 *
 *   return instrument(
 *     {agent_id: "my-langchain-agent", server_url, tool_name},
 *     async () => handleTool(args),
 *   );
 */
export async function instrument<T>(
  meta: { agent_id: string; server_url: string; tool_name: string },
  run: () => Promise<T>,
  options: ReportOptions = {}
): Promise<T> {
  const agent_id = validateAgentId(meta.agent_id);
  const start = Date.now();
  try {
    const result = await run();
    // Fire-and-forget: do not await the report.
    void report(
      {
        agent_id,
        server_url: meta.server_url,
        success: true,
        latency_ms: Date.now() - start,
        tool_name: meta.tool_name,
        http_status: 200,
      },
      options
    );
    return result;
  } catch (err) {
    void report(
      {
        agent_id,
        server_url: meta.server_url,
        success: false,
        latency_ms: Date.now() - start,
        tool_name: meta.tool_name,
        http_status: 500,
      },
      options
    );
    throw err;
  }
}

export const observatory = { report, checkTrust, instrument };
export default observatory;
