# sg-company-lookup-mcp

MCP server providing Singapore company intelligence — UEN validation, entity type identification, SSIC industry statistics, and company status checks via ACRA public data.

## Endpoint

`https://sg-company-lookup-mcp.sgdata.workers.dev/mcp`

## Tools (4)

| Tool | Description |
|------|-------------|
| `lookup_company` | Search by company name or UEN with format validation and entity type identification |
| `get_company_officers` | Directors and officers lookup (points to BizFile+ source) |
| `get_industry_stats` | Company registration trends by SSIC sector (2021-2024) |
| `check_company_status` | Active/struck-off/dissolved status verification |

## Protocol

- MCP JSON-RPC 2.0 (protocol version 2024-11-05)
- Endpoints: `GET /` | `GET /health` | `GET /.well-known/mcp.json` | `POST /mcp`

## Data Coverage

- 830,000+ live entities (ACRA data)
- UEN format support: Business (old), Local Company, LLP, Foreign branches, Government agencies
- 21 SSIC sectors (A-U classification)

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
