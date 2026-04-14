# dominion-observatory-sdk (TypeScript)

One-line agent behavioral telemetry for MCP servers, LangChain tools, AutoGen
agents, and CrewAI workers. Feeds the [Dominion
Observatory](https://dominion-observatory.sgdata.workers.dev), the only MCP
scoring network that accepts **agent-reported runtime data** instead of static
GitHub/registry signals.

## Install

Zero-dependency ES module over the Observatory's own CDN — no npm, no build,
no bundler config. Works in Cloudflare Workers, Deno, Bun, Node 18+, and
modern browsers:

```ts
import { report, checkTrust, instrument } from "https://sdk-cdn.sgdata.workers.dev/v1/observatory.mjs";
```

Types available at the same URL base:

```ts
/// <reference types="https://sdk-cdn.sgdata.workers.dev/v1/observatory.d.ts" />
```

> **npm** — publish pending (npm Classic Automation Token required). The CDN is
> the canonical install channel today; every fetch fires anonymized
> adoption telemetry back into the Observatory.

## Usage

```ts
import { report, checkTrust, instrument } from "https://sdk-cdn.sgdata.workers.dev/v1/observatory.mjs";

const SERVER_URL = "https://my-mcp-server.example.com/mcp";

// 1. Fire-and-forget telemetry in a tool handler (Cloudflare Workers)
export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const start = Date.now();
    const result = await handleTool(request);
    ctx.waitUntil(
      report({
        server_url: SERVER_URL,
        success: result.ok,
        latency_ms: Date.now() - start,
        tool_name: "get_holidays",
        http_status: result.status,
      })
    );
    return result;
  },
};

// 2. Convenience wrapper: measures latency automatically, reports on both
//    success and failure, rethrows the error unchanged.
const data = await instrument(
  { server_url: SERVER_URL, tool_name: "get_holidays" },
  () => doWork()
);

// 3. Read a trust score before delegating to another server
const score = await checkTrust("https://some-other-mcp.example.com/mcp");
if (score.found && (score.trust_score ?? 0) >= 70) {
  await callThatServer();
}
```

### LangChain

```ts
import { DynamicTool } from "@langchain/core/tools";
import { instrument } from "https://sdk-cdn.sgdata.workers.dev/v1/observatory.mjs";

const myTool = new DynamicTool({
  name: "get_holidays",
  description: "Look up SG public holidays",
  func: async (input: string) =>
    instrument(
      { server_url: SERVER_URL, tool_name: "get_holidays" },
      () => fetchHolidays(input)
    ),
});
```

### AutoGen / CrewAI

Wrap your tool function body in `instrument(...)` the same way. The SDK has
zero dependencies and does not require a specific agent framework.

## What gets sent

Exactly these five fields, and nothing else:

| Field         | Example                                     |
| ------------- | ------------------------------------------- |
| `server_url`  | `https://my-mcp-server.example.com/mcp`     |
| `success`     | `true`                                      |
| `latency_ms`  | `142`                                       |
| `tool_name`   | `get_holidays`                              |
| `http_status` | `200`                                       |

**Not sent**: query arguments, tool output, user IDs, IP addresses, auth tokens,
or any other payload. This satisfies Singapore PDPA and IMDA's agentic AI
transparency requirements, and is compatible with EU AI Act Article 12 logging.

## Why this exists

5+ MCP scoring platforms already exist (Glama, Smithery, MCP Scorecard, Nerq,
Zarq), but all of them score servers from the outside using GitHub and registry
metadata. None of them observe what happens when an agent actually calls a
tool. The Dominion Observatory is the only network that collects
agent-reported, cross-ecosystem runtime behavior — the only data that ages into
compounding value because it can't be backfilled.

Every install of this SDK is a permanent telemetry pipeline.

## License

MIT
