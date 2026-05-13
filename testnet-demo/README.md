# x402 Trust-Provider Testnet Demo

**Proof-of-concept**: chains Dominion Observatory trust data into the x402 `beforeSettle` hook and gates a USDC transfer on Base Sepolia.

## What this demonstrates

1. **TrustQuery** — constructs a spec-conformant query (v0.1) for an agent
2. **Observatory adapter** — queries the live Dominion Observatory REST API, adapts the response into a `TrustEvaluation`
3. **beforeSettle hook** — runs N providers in parallel, applies STRICT aggregation
4. **Settlement gate** — if PASS, executes a USDC transfer on Base Sepolia; if FAIL/UNCERTAIN, blocks settlement
5. **Advisory headers** — emits `X-Trust-Decision`, `X-Trust-Score`, `X-Trust-Evidence-URI`

## Quick start

```bash
# Install dependencies
npm install

# Dry run (no wallet needed)
npm run demo:dry-run

# Live testnet (requires Base Sepolia ETH + testnet USDC)
PRIVATE_KEY=0x... npm run demo
```

## Getting testnet tokens

1. **Base Sepolia ETH**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
2. **Testnet USDC**: https://faucet.circle.com/

## Architecture

```
                    TrustQuery
  Demo script ----------------------> Dominion Observatory
  (server)                            /api/agent-query/{id}
              <----------------------
                  TrustEvaluation

  beforeSettle --> Aggregation (STRICT)
                     |
                     +- PASS --> transfer USDC (Base Sepolia)
                     +- FAIL --> HTTP 402, no settlement
                     +- UNCERTAIN --> HTTP 402 (fail-closed)
```

## Spec reference

- [x402 Trust-Provider Interface v0.1](../specs/x402-trust-provider-interface/v0.1/SPEC.md)
- [Dominion Observatory](https://dominion-observatory.sgdata.workers.dev)
- [Observatory REST API](https://dominion-observatory.sgdata.workers.dev/api/stats)

## Files

| File | Purpose |
|------|---------|
| `src/trust-provider.ts` | Wire types, Observatory adapter, aggregation engine |
| `src/demo.ts` | End-to-end demo: query -> gate -> settle |
| `package.json` | Dependencies (viem for Base Sepolia) |
