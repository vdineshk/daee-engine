# sg-company-lookup-mcp

MCP server for Singapore company intelligence. Part of the DAEE fleet. Reports anonymized telemetry to the Dominion Observatory.

- Live endpoint: https://sg-company-lookup-mcp.sgdata.workers.dev/mcp
- Health: https://sg-company-lookup-mcp.sgdata.workers.dev/health
- Trust score: https://dominion-observatory.sgdata.workers.dev/api/trust?url=https://sg-company-lookup-mcp.sgdata.workers.dev/mcp
- Category: data

## Tools

- **lookup_company** — Search Singapore companies by name or UEN.
- **get_company_officers** — Directors and officers for a given UEN.
- **get_industry_stats** — Registration/cessation trends by SSIC sector.
- **check_company_status** — Active/struck-off/dissolved status for any UEN.

## Pricing

Free: 5 calls/day. Starter $29 / Pro $99 / Enterprise $299 per month.

## Telemetry

Anonymized metrics (success/fail, latency_ms, tool_name, http_status) are reported to the Dominion Observatory. No query content or user data collected. PDPA + IMDA compliant.
