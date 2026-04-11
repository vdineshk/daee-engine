# asean-trade-rules-mcp

MCP server for ASEAN trade rules — RCEP, CPTPP, AFTA/ATIGA FTA eligibility, rules of origin, tariff savings calculations, and documentation requirements for cross-border trade.

## Endpoint

`https://asean-trade-rules-mcp.sgdata.workers.dev/mcp`

## Tools (4)

| Tool | Description |
|------|-------------|
| `check_fta_eligibility` | Determine applicable FTAs given HS code, origin country, and destination country |
| `get_rules_of_origin` | Product-specific rules for qualifying under each FTA |
| `calculate_tariff_savings` | Compare MFN vs preferential tariff rates and estimate savings |
| `get_documentation_requirements` | Required certificates, forms, and documents for each FTA |

## Protocol

- MCP JSON-RPC 2.0 (protocol version 2024-11-05)
- Endpoints: `GET /` | `GET /health` | `GET /.well-known/mcp.json` | `POST /mcp`

## FTA Coverage

- **RCEP** — 15 member economies
- **CPTPP** — 12 member economies
- **AFTA/ATIGA** — 10 ASEAN member states
- **Singapore bilateral FTAs** — US, EU, China, India, Japan, Korea, Australia, and more

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
