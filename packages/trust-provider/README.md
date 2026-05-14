# @dominion/trust-provider

> x402 Trust-Provider Interface — behavioral trust scoring for the agent economy.

[![npm](https://img.shields.io/npm/v/@dominion/trust-provider)](https://www.npmjs.com/package/@dominion/trust-provider)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Query **14,800+ MCP servers** via [Dominion Observatory](https://dominion-observatory.sgdata.workers.dev) and gate payments using the [x402 Trust-Provider Interface v0.1](https://github.com/vdineshk/daee-engine/blob/main/specs/x402-trust-provider-interface/v0.1/SPEC.md).

## Install

```bash
npm install @dominion/trust-provider
```

## Quick start

```typescript
import { query } from "@dominion/trust-provider";

const result = await query("my-agent-id");

if (result.decision === "PASS") {
  // proceed with payment settlement
} else {
  // block or hold settlement
  console.log(result.reason_code);
}
```

## Usage with x402 beforeSettle

```typescript
import {
  createObservatoryProvider,
  beforeSettle,
  advisoryHeaders,
  type TrustQuery,
  type BeforeSettleConfig,
} from "@dominion/trust-provider";

// Build query
const trustQuery: TrustQuery = {
  schema: "x402-trust-query-v0.1",
  payer: { agent_id: "requesting-agent" },
  resource: {
    url: "https://api.example.com/data",
    method: "GET",
    amount: { value: "1.00", currency: "USDC", chain: "base" },
  },
  requested_at: new Date().toISOString(),
};

// Configure providers
const config: BeforeSettleConfig = {
  providers: [createObservatoryProvider()],
  policy: { kind: "strict" },
  failureMode: "fail-closed",
  perProviderTimeoutMs: 5000,
};

// Run the gate
const result = await beforeSettle(trustQuery, config);

if (result.decision === "PASS") {
  // Settlement authorized — call facilitator
  const hdrs = advisoryHeaders(result);
  // hdrs = { "X-Trust-Decision": "PASS", "X-Trust-Score": "0.850", ... }
}
```

## API

### `query(agentId, config?)`

One-call trust evaluation. Returns a `TrustEvaluation` with decision, score, and evidence.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `agentId` | `string` | — | Agent identifier to query |
| `config.baseUrl` | `string` | Observatory URL | Custom provider URL |
| `config.timeoutMs` | `number` | `5000` | Request timeout |

### `createObservatoryProvider(config?)`

Creates a `TrustProvider` for use with `beforeSettle`. Accepts the same config as `query`.

### `beforeSettle(query, config)`

Full hook implementation. Queries all providers in parallel, applies aggregation policy, returns final decision.

| Config field | Type | Description |
|-------------|------|-------------|
| `providers` | `TrustProvider[]` | Array of trust providers |
| `policy` | `AggregationPolicy` | `strict`, `quorum`, or `custom` |
| `failureMode` | `"fail-closed" \| "fail-open"` | Behavior on provider error |
| `perProviderTimeoutMs` | `number` | Per-provider timeout |

### `advisoryHeaders(result)`

Generates x402 advisory response headers from a `BeforeSettleResult`.

### `aggregateStrict(evals)` / `aggregateQuorum(evals)`

Aggregation functions per SPEC.md section 5. Strict requires all PASS; quorum requires majority.

## Decision thresholds

| Score range | Decision | Meaning |
|------------|----------|---------|
| >= 60 | `PASS` | Trusted — proceed with settlement |
| 40–59 | `UNCERTAIN` | Review band — policy-dependent |
| < 40 | `FAIL` | Untrusted — block settlement |

## Wire types

```typescript
interface TrustQuery {
  schema: "x402-trust-query-v0.1";
  payer: { wallet?: string; agent_id?: string; session_id?: string };
  resource: { url: string; method?: string; amount?: { value: string; currency: string; chain: string } };
  context?: { category?: string; risk_band?: "low" | "medium" | "high" };
  requested_at: string;
}

type TrustDecision = "PASS" | "FAIL" | "UNCERTAIN";

interface TrustEvaluation {
  schema: "x402-trust-evaluation-v0.1";
  provider: string;
  provider_url: string;
  decision: TrustDecision;
  score?: number;
  evidence_uri?: string;
  reason_code?: string;
  ttl_seconds?: number;
  evaluated_at: string;
}
```

## Links

- [Dominion Observatory](https://dominion-observatory.sgdata.workers.dev) — live trust data for 14,800+ MCP servers
- [x402 Trust-Provider Spec v0.1](https://github.com/vdineshk/daee-engine/blob/main/specs/x402-trust-provider-interface/v0.1/SPEC.md)
- [x402 Protocol](https://github.com/x402-foundation/x402)

## License

MIT
