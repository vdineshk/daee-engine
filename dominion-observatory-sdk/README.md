# Dominion Observatory SDK

One-line agent behavioral telemetry — the data collection flywheel of the
[Dominion Observatory](https://dominion-observatory.sgdata.workers.dev).

**Python — pip:**

```bash
pip install dominion-observatory-sdk
```

**TypeScript / JS — npm:**

```bash
npm install dominion-observatory-sdk
```

**TypeScript / JS — CDN (zero-install, works in Workers, Deno, Bun, Node 18+):**

```ts
import { report, checkTrust, instrument } from "https://sdk-cdn.sgdata.workers.dev/v1/observatory.mjs";

await report({
  agent_id: "acme-scheduler@1.2.0",
  server_url: "https://my-mcp.example.com/mcp",
  success: true,
  latency_ms: 142,
  tool_name: "get_holidays",
});
```

> **Breaking change in 0.2.0:** `agent_id` is now required on every `report()`
> and `instrument()` call. Missing, empty, or reserved values (`anonymous`,
> `observatory_probe`) throw synchronously. See the per-language READMEs for
> upgrade notes.

**Python — CDN alternative (single file, stdlib only):**

```bash
curl -O https://sdk-cdn.sgdata.workers.dev/v1/observatory.py
```

Install page with copy-paste snippets: <https://sdk-cdn.sgdata.workers.dev>

- [TypeScript source](./typescript)
- [Python source](./python)

> **PyPI** — live at <https://pypi.org/project/dominion-observatory-sdk/0.2.0/>
> **npm** — live at <https://www.npmjs.com/package/dominion-observatory-sdk>
> **CDN** — live at <https://sdk-cdn.sgdata.workers.dev/v1/observatory.mjs> (`X-SDK-Version: 0.2.0`)

Three functions, identical semantics across both languages:

| Function     | What it does                                                            |
| ------------ | ----------------------------------------------------------------------- |
| `report`     | Fire-and-forget anonymized interaction telemetry to the Observatory     |
| `checkTrust` | Fetch a server's current behavioral trust score                         |
| `instrument` | Convenience wrapper that times a handler and reports success or failure |

## Why another MCP scoring tool?

It isn't one. **Dominion Observatory is the only MCP trust network that accepts
agent-reported runtime data.**

| Platform       | Scoring signal                       | Accepts agent telemetry | Compliance attestation |
| -------------- | ------------------------------------ | ----------------------- | ---------------------- |
| Glama          | Tool description quality (static)    | No                      | No                     |
| Smithery       | Metadata completeness (static)       | No                      | No                     |
| MCP Scorecard  | GitHub + registry metadata (static)  | No                      | No                     |
| Nerq           | Security / docs / popularity (static)| No                      | No                     |
| Zarq           | Nerq methodology (static)            | No                      | No                     |
| BlueRock       | Runtime **security** sensors only    | No (own infra only)     | No                     |
| **Observatory**| **Cross-ecosystem agent-reported runtime telemetry** | **Yes** | **EU AI Act + IMDA**   |

Static scoring tops out at describing the code. Runtime scoring describes the
actual behavior of the agent economy. Once enough interactions are reported, the
resulting dataset cannot be backfilled — it is temporally non-replicable.

## Privacy and compliance

Reports carry exactly six fields: `agent_id`, `server_url`, `success`,
`latency_ms`, `tool_name`, `http_status`. Nothing else. No query content, user
identifiers, IP addresses, auth tokens, or tool outputs. The `agent_id` is a
caller-chosen stable string (package name or persisted UUID) and is the only
identifier the Observatory stores for cross-ecosystem attribution.

This satisfies:
- **Singapore PDPA** — no personal data is transmitted.
- **IMDA Model AI Governance Framework (2026)** — transparency and logging.
- **EU AI Act Article 12** — event-logging for high-risk AI systems.

Every response from an Observatory-instrumented server includes a
`meta.telemetry` field disclosing exactly what was collected, so that downstream
agents and auditors can inspect the data contract.

## License

MIT
