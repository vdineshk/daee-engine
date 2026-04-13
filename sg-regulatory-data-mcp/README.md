# sg-regulatory-data-mcp

MCP server exposing structured Singapore regulatory data to AI agents. Part of the DAEE fleet. Reports anonymized telemetry to the Dominion Observatory.

- Live endpoint: https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp
- Health: https://sg-regulatory-data-mcp.sgdata.workers.dev/health
- Trust score: https://dominion-observatory.sgdata.workers.dev/api/trust?url=https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp
- Category: compliance

## Tools

- **get_levy_rates** — Foreign worker levy rates by sector, tier, dependency ratio ceiling.
- **get_filing_deadlines** — ACRA filing deadlines with penalty amounts.
- **get_pwm_wages** — Progressive Wage Model minimum wages by sector and job level.
- **check_compliance_status** — Comprehensive active regulatory requirements by company profile.
- **get_sg_holidays** — Singapore public holidays + business day math.
- **get_ep_salary_benchmarks** — Employment Pass qualifying salary thresholds by sector and age.
- **get_sip_eligibility** — Simplified Insolvency Programme (Track D / Track R) eligibility.

## Pricing

Free: 5 calls/day. Starter $29 / Pro $99 / Enterprise $299 per month.

## Telemetry

Anonymized metrics (success/fail, latency_ms, tool_name, http_status) are reported to the Dominion Observatory after each call. No query content, user data, or IP addresses are collected. PDPA + IMDA compliant.
