/**
 * Dominion Observatory SDK (TypeScript)
 *
 * Two functions:
 *   - report(args): send anonymized interaction telemetry to the Observatory
 *   - checkTrust(serverUrl): fetch a server's behavioral trust score
 *
 * Privacy: reports carry ONLY {server_url, success, latency_ms, tool_name, http_status}.
 * No query content, user data, or IP addresses are collected.
 *
 * Use it from any MCP server, LangChain tool, AutoGen agent, or CrewAI worker to
 * contribute to — and read from — the cross-ecosystem agent behavioral trust network.
 */
const OBSERVATORY_MCP_URL = "https://dominion-observatory.sgdata.workers.dev/mcp";
const OBSERVATORY_API_URL = "https://dominion-observatory.sgdata.workers.dev/api";
/**
 * Fire-and-forget telemetry report. Never throws.
 *
 * The returned Promise resolves to true on HTTP 2xx, false otherwise.
 * In fire-and-forget usage you can simply ignore the return value — it will
 * never reject and never block your tool handler.
 */
export async function report(args, options = {}) {
    const endpoint = options.endpoint ?? OBSERVATORY_MCP_URL;
    const fetchImpl = options.fetch ?? globalThis.fetch;
    const timeoutMs = options.timeoutMs ?? 2000;
    if (!fetchImpl)
        return false;
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
    }
    catch {
        return false;
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * Fetch a server's current trust score from the Observatory.
 * Returns {found: false, server_url} if the Observatory has no record of the server.
 */
export async function checkTrust(serverUrl, options = {}) {
    const endpoint = options.endpoint ?? OBSERVATORY_API_URL;
    const fetchImpl = options.fetch ?? globalThis.fetch;
    const timeoutMs = options.timeoutMs ?? 3000;
    if (!fetchImpl)
        return { found: false, server_url: serverUrl };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const url = `${endpoint}/trust?url=${encodeURIComponent(serverUrl)}`;
        const res = await fetchImpl(url, { signal: controller.signal });
        if (!res.ok)
            return { found: false, server_url: serverUrl };
        return (await res.json());
    }
    catch {
        return { found: false, server_url: serverUrl };
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * Convenience wrapper that measures latency and reports it.
 * Use it to instrument a single tool handler with one line.
 *
 *   return instrument({server_url, tool_name}, async () => handleTool(args));
 */
export async function instrument(meta, run, options = {}) {
    const start = Date.now();
    try {
        const result = await run();
        // Fire-and-forget: do not await the report.
        void report({
            server_url: meta.server_url,
            success: true,
            latency_ms: Date.now() - start,
            tool_name: meta.tool_name,
            http_status: 200,
        }, options);
        return result;
    }
    catch (err) {
        void report({
            server_url: meta.server_url,
            success: false,
            latency_ms: Date.now() - start,
            tool_name: meta.tool_name,
            http_status: 500,
        }, options);
        throw err;
    }
}
export const observatory = { report, checkTrust, instrument };
export default observatory;
//# sourceMappingURL=index.js.map