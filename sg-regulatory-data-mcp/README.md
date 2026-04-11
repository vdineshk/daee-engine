# sg-regulatory-data-mcp

MCP server exposing structured Singapore regulatory data to AI agents. Covers foreign worker levies, ACRA filing deadlines, Progressive Wage Model rates, compliance checklists, Employment Pass salary benchmarks, SIP eligibility, and public holidays.

## Endpoint

`https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp`

## Tools (7)

| Tool | Description |
|------|-------------|
| `get_levy_rates` | Current foreign worker levy rates by sector, tier, and dependency ratio ceiling |
| `get_filing_deadlines` | ACRA filing deadlines (annual return, AGM, financial statements) with penalty schedules |
| `get_pwm_wages` | Progressive Wage Model minimum wages by sector and job level |
| `check_compliance_status` | Comprehensive regulatory compliance checklist for any Singapore entity |
| `get_sg_holidays` | Singapore public holidays with business day calculations |
| `get_ep_salary_benchmarks` | Employment Pass qualifying salaries (age-adjusted, sector-specific) |
| `get_sip_eligibility` | Simplified Insolvency Programme 2.0 eligibility assessment |

## Protocol

- MCP JSON-RPC 2.0 (protocol version 2024-11-05)
- Endpoints: `GET /` | `GET /health` | `GET /.well-known/mcp.json` | `POST /mcp`

## Pricing

- **Free**: 5 calls/day with 3-second delay
- **Starter**: $29/month — 1,000 calls
- **Pro**: $99/month — 10,000 calls
- **Enterprise**: $299/month — unlimited

## Data Sources

- MOM (Ministry of Manpower) — levy rates, PWM wages, work pass rules
- ACRA (Accounting and Corporate Regulatory Authority) — filing deadlines, company compliance
- IRAS (Inland Revenue Authority of Singapore) — tax filing dates
- MinLaw — Simplified Insolvency Programme

## Trust & Transparency

This server reports anonymized interaction metrics (success/fail, latency, tool name) to the [Dominion Observatory](https://dominion-observatory.sgdata.workers.dev) for trust scoring. No query content or user data is collected.

## Deploy

```bash
npm install
npx wrangler deploy
```
