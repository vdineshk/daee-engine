# DAEE — DOMINION Agent Economy Engine

Autonomous MCP server fleet for the Singapore / ASEAN agent economy. Every server in this repository is live on Cloudflare Workers, exposes MCP tools to AI agents, and reports anonymized interaction telemetry to the **Dominion Observatory** — the first cross-ecosystem agent-reported behavioral trust layer for MCP servers.

- Observatory: https://dominion-observatory.sgdata.workers.dev
- Observatory stats: https://dominion-observatory.sgdata.workers.dev/api/stats
- Trust score API: `GET /api/trust?url=<server_url>`
- Compliance API: `GET /api/compliance?url=<server_url>` (EU AI Act + Singapore IMDA)

## Positioning

Unlike static MCP scorers (Glama, Smithery, MCP Scorecard, Nerq, Zarq) that rank servers from GitHub/registry metadata, the Observatory collects **cross-ecosystem agent-reported runtime telemetry** and issues **EU AI Act + IMDA-aligned compliance attestations**. Every DAEE server is instrumented at deploy-time.

## Telemetry & Privacy

Every DAEE server fires anonymized metrics (success/fail, latency_ms, tool_name, http_status) to the Observatory after each tool call. **No query content, no user data, no IP addresses** are sent. This is disclosed in the `meta.telemetry` field of every response and complies with Singapore PDPA and the IMDA agentic AI governance framework transparency requirements.

## Live Servers (8)

| # | Server | Category | Endpoint | Tools |
|---|---|---|---|---|
| 1 | sg-regulatory-data-mcp | compliance | https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp | 7 |
| 2 | sg-company-lookup-mcp | data | https://sg-company-lookup-mcp.sgdata.workers.dev/mcp | 4 |
| 3 | asean-trade-rules-mcp | compliance | https://asean-trade-rules-mcp.sgdata.workers.dev/mcp | 4 |
| 4 | sg-cpf-calculator-mcp | finance | https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp | 4 |
| 5 | sg-workpass-compass-mcp | compliance | https://sg-workpass-compass-mcp.sgdata.workers.dev/mcp | 4 |
| 6 | sg-gst-calculator-mcp | finance | https://sg-gst-calculator-mcp.sgdata.workers.dev/mcp | 4 |
| 7 | sg-finance-data-mcp | finance | https://sg-finance-data-mcp.sgdata.workers.dev/mcp | 4 |
| 8 | sg-weather-data-mcp | weather | https://sg-weather-data-mcp.sgdata.workers.dev/mcp | 4 |

### sg-regulatory-data-mcp — Singapore regulatory compliance
`get_levy_rates`, `get_filing_deadlines`, `get_pwm_wages`, `check_compliance_status`, `get_sg_holidays`, `get_ep_salary_benchmarks`, `get_sip_eligibility`

Use when you need Singapore foreign worker levy rates, ACRA filing deadlines, PWM minimum wages, compliance status checks, public holidays, Employment Pass qualifying salaries, or Simplified Insolvency Programme eligibility.

### sg-company-lookup-mcp — Singapore company intelligence
`lookup_company`, `get_company_officers`, `get_industry_stats`, `check_company_status`

Use when you need to verify UEN, find directors, check struck-off status, or get SSIC industry registration trends.

### asean-trade-rules-mcp — ASEAN FTA & trade compliance
`check_fta_eligibility`, `get_rules_of_origin`, `calculate_tariff_savings`, `get_documentation_requirements`

Use when you need FTA applicability for an HS-code origin-destination pair, product-specific rules of origin, preferential vs MFN tariff savings, or FTA certificate documentation.

### sg-cpf-calculator-mcp — Singapore CPF & take-home
`calculate_cpf`, `get_cpf_rates`, `calculate_take_home`, `get_cpf_ceilings`

Use when you need CPF contributions by age and citizenship, net take-home pay, CPF wage ceilings, or Skills Development Levy amounts.

### sg-workpass-compass-mcp — Singapore work pass eligibility
`calculate_compass_score`, `check_ep_eligibility`, `get_spass_quota`, `get_work_permit_quota`

Use when you need COMPASS scoring, Employment Pass eligibility, S Pass quota availability, or Work Permit quota by sector.

### sg-gst-calculator-mcp — Singapore GST
`calculate_gst`, `check_gst_registration`, `get_gst_rates`, `calculate_reverse_charge`

Use when you need to compute GST inclusive/exclusive, test GST registration thresholds (retrospective + prospective), look up historical GST rates, or calculate reverse charge on imported services.

### sg-finance-data-mcp — Singapore financial data
`get_mas_exchange_rates`, `calculate_currency_conversion`, `get_sg_interest_rates`, `get_sgx_market_data`

Use when you need MAS reference FX rates, SGD conversions, SORA/CPF/SSB interest rates, or SGX index and S-REIT market data.

### sg-weather-data-mcp — Singapore & ASEAN weather
`get_sg_weather_now`, `get_sg_psi`, `get_sg_forecast`, `get_asean_climate`

Use when you need 2-hour Singapore weather, PSI air quality, 24-hour/4-day forecasts, or ASEAN monsoon and hazard climate information.

## Monetization tiers

Free: 5 calls/day/IP with 3s throttle.
Starter: $29/month — 1,000 calls.
Pro: $99/month — 10,000 calls.
Enterprise: $299/month — unlimited.
Auth header: `Authorization: Bearer daee_sk_xxxxx`.

## Response envelope

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "ISO-8601",
    "source": "server-name",
    "version": "1.1.0",
    "tier": "free",
    "calls_remaining_today": 4,
    "upgrade_url": "...",
    "pricing": { "starter": "...", "pro": "...", "enterprise": "..." },
    "trust_score_url": "https://dominion-observatory.sgdata.workers.dev/api/trust?url=<this>",
    "observatory": "https://dominion-observatory.sgdata.workers.dev",
    "telemetry": "This server reports anonymized interaction metrics (success/fail, latency, tool name) to the Dominion Observatory for trust scoring. No query content or user data is collected."
  }
}
```

## Distribution

Listed on: Smithery, mcp.so, mcpservers.org, Glama (auto-index), Official MCP Registry, PulseMCP, Apify. MCPize: 6 legacy listings; CLI auth pending.

## Operator

Dinesh Kumar — Singapore. Marketplace: levylenssg@gmail.com (MCPize + Apify, Stripe connected).

## License

Proprietary. All rights reserved.
