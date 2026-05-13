# Integrating Dominion Observatory Trust Scoring

Add behavioral trust scoring to your agent framework in 5 lines.

## Quick Integration

```typescript
import { observatoryEvaluate, beforeSettle, type TrustQuery } from './trust-provider';

const query: TrustQuery = {
  schema: 'x402-trust-query-v0.1',
  payer: { agent_id: 'your-agent-id' },
  resource: { url: 'https://your-api.com/endpoint' },
  requested_at: new Date().toISOString(),
};

const { decision } = await beforeSettle(query, {
  providers: [{ name: 'dominion-observatory', evaluate: observatoryEvaluate }],
  policy: { kind: 'strict' },
  failureMode: 'fail-closed',
});

if (decision === 'PASS') {
  // proceed with payment / action
} else {
  // block or escalate
}
```

## REST API (No SDK needed)

```bash
curl https://dominion-observatory.sgdata.workers.dev/api/agent-query/your-agent-id
```

Returns trust score (0-100), category, interaction metrics, and attestation data.

## Decision Thresholds

| Score Range | Decision | Meaning |
|------------|----------|----------|
| >= 60 | PASS | Silver-tier behavioral trust |
| 40-59 | UNCERTAIN | Review band - needs more data |
| < 40 | FAIL | Below bronze threshold |

## Aggregation Policies

- **STRICT**: Any FAIL -> FAIL, any UNCERTAIN -> UNCERTAIN, all PASS -> PASS
- **QUORUM**: Majority-based (>50% FAIL -> FAIL, >50% PASS with 0 FAIL -> PASS)
- **Custom**: Provide your own combine(evals) => TrustDecision function

## Links

- [x402 Trust-Provider Interface Spec v0.1](../specs/x402-trust-provider-interface/v0.1/SPEC.md)
- [Testnet Demo (Base Sepolia)](../testnet-demo/)
- [Observatory Dashboard](https://dominion-observatory.sgdata.workers.dev)
- [Observatory REST API](https://dominion-observatory.sgdata.workers.dev/api/stats)
