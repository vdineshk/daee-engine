# sg-workpass-compass-mcp

MCP server for Singapore COMPASS scoring, Employment Pass eligibility, S Pass quotas, and Work Permit levy calculations. Essential for hiring foreign talent in Singapore.

## Endpoint

`https://sg-workpass-compass-mcp.sgdata.workers.dev/mcp`

## Tools (4)

| Tool | Description |
|------|-------------|
| `calculate_compass_score` | Full 6-criterion COMPASS assessment (salary, qualifications, diversity, support, skills, strategic) |
| `check_ep_eligibility` | Minimum qualifying salary check with COMPASS requirement determination |
| `get_spass_quota` | S Pass slot availability by sector DRC and salary verification |
| `get_work_permit_quota` | Work Permit slot availability and levy tier calculations |

## Protocol

- MCP JSON-RPC 2.0 (protocol version 2024-11-05)
- Endpoints: `GET /` | `GET /health` | `GET /.well-known/mcp.json` | `POST /mcp`

## Coverage

- Effective date: January 2026
- EP qualifying salary: $5,600 (general), $6,200 (financial services)
- COMPASS pass threshold: 40 points across 6 criteria
- S Pass DRC: 10-18% by sector
- Work Permit DRC: 35-87.5% by sector with levy tiers

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
