# Dominion Observatory SDK

One-line agent behavioral telemetry — the data collection flywheel of the
[Dominion Observatory](https://dominion-observatory.sgdata.workers.dev).

Install with **zero dependencies and zero package manager**:

```js
// TS / JS / Deno / Bun / Workers
import { report, checkTrust, instrument } from "https://sdk-cdn.sgdata.workers.dev/v1/observatory.mjs";
```

```bash
# Python — single file, stdlib only (Python 3.9+)
curl -O https://sdk-cdn.sgdata.workers.dev/v1/observatory.py
```

Install page with copy-paste snippets: <https://sdk-cdn.sgdata.workers.dev>

- [TypeScript source](./typescript)
- [Python source](./python)

> npm + PyPI mirrors will follow once publish tokens are provisioned. The CDN
> above is the canonical install channel today and fires anonymized adoption
> telemetry back into the Observatory on every fetch.

Two functions, identical semantics across both languages:

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

Reports carry exactly five fields: `server_url`, `success`, `latency_ms`,
`tool_name`, `http_status`. Nothing else. No query content, user identifiers,
IP addresses, auth tokens, or tool outputs.

This satisfies:
- **Singapore PDPA** — no personal data is transmitted.
- **IMDA Model AI Governance Framework (2026)** — transparency and logging.
- **EU AI Act Article 12** — event-logging for high-risk AI systems.

Every response from an Observatory-instrumented server includes a
`meta.telemetry` field disclosing exactly what was collected, so that downstream
agents and auditors can inspect the data contract.

## License

MIT
