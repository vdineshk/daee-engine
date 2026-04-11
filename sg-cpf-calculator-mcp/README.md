# sg-cpf-calculator-mcp

MCP server for Singapore CPF (Central Provident Fund) contribution calculations. Computes employee/employer contributions, OA/SA/MA allocations, take-home pay, and employer cost including SDL.

## Endpoint

`https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp`

## Tools (4)

| Tool | Description |
|------|-------------|
| `calculate_cpf` | Full CPF calculation — employee/employer contributions, account allocations, take-home pay |
| `get_cpf_rates` | CPF rate tables by citizenship status and age band |
| `calculate_take_home` | Quick salary-to-take-home conversion after CPF deduction |
| `get_cpf_ceilings` | OW/AW ceilings and Skills Development Levy rates |

## Protocol

- MCP JSON-RPC 2.0 (protocol version 2024-11-05)
- Endpoints: `GET /` | `GET /health` | `GET /.well-known/mcp.json` | `POST /mcp`

## Coverage

- Effective date: January 2026
- Citizenship statuses: Citizen, SPR 1st/2nd/3rd year onwards
- Age bands: 55 and below, 55-60, 60-65, 65-70, 70+
- OW ceiling: $8,000/month | AW ceiling: $102,000/year

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
