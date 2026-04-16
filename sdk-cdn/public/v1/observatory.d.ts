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
/**
 * Fire-and-forget telemetry report. Throws synchronously ONLY on invalid agent_id.
 * Otherwise the returned Promise resolves to true on HTTP 2xx, false otherwise
 * and never rejects — safe to ignore.
 */
export declare function report(args: ReportArgs, options?: ReportOptions): Promise<boolean>;
/**
 * Fetch a server's current trust score from the Observatory.
 * Returns {found: false, server_url} if the Observatory has no record of the server.
 */
export declare function checkTrust(serverUrl: string, options?: ReportOptions): Promise<TrustScore>;
/**
 * Convenience wrapper that measures latency and reports it.
 * Use it to instrument a single tool handler with one line.
 *
 *   return instrument(
 *     {agent_id: "my-langchain-agent", server_url, tool_name},
 *     async () => handleTool(args),
 *   );
 */
export declare function instrument<T>(meta: {
    agent_id: string;
    server_url: string;
    tool_name: string;
}, run: () => Promise<T>, options?: ReportOptions): Promise<T>;
export declare const observatory: {
    report: typeof report;
    checkTrust: typeof checkTrust;
    instrument: typeof instrument;
};
export default observatory;
//# sourceMappingURL=index.d.ts.map