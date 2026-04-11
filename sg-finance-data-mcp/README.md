# sg-finance-data-mcp

MCP server for Singapore financial data — MAS exchange rates, SGD currency conversion, SORA/CPF/SSB interest rates, SGX market structure, S-REITs, and CPF investment schemes.

## Endpoint

`https://sg-finance-data-mcp.sgdata.workers.dev/mcp`

## Tools (4)

| Tool | Description |
|------|-------------|
| `get_mas_exchange_rates` | MAS reference exchange rates for SGD against 20+ currencies |
| `calculate_currency_conversion` | Convert amounts between any currency and SGD using MAS rates |
| `get_sg_interest_rates` | Benchmark rates: SORA, CPF (OA/SA/MA/RA), SSB yields, savings ranges |
| `get_sgx_market_data` | SGX indices, sector breakdown, S-REIT statistics, listing requirements |

## Protocol

- MCP JSON-RPC 2.0 (protocol version 2024-11-05)
- Endpoints: `GET /` | `GET /health` | `GET /.well-known/mcp.json` | `POST /mcp`

## Data Sources

- MAS (Monetary Authority of Singapore) — exchange rates, interest rates
- SGX (Singapore Exchange) — market data, indices
- CPF Board — CPF interest rates, investment schemes

## Pricing

- **Free**: 5 calls/day with 3-second delay
- **Starter**: $29/month — 1,000 calls
- **Pro**: $99/month — 10,000 calls
- **Enterprise**: $299/month — unlimited

## Trust & Transparency

This server reports anonymized interaction metrics to the [Dominion Observatory](https://dominion-observatory.sgdata.workers.dev) for trust scoring. No query content or user data is collected.

## Deploy

```bash
npm install
npx wrangler deploy
```
