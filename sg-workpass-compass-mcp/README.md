# sg-workpass-compass-mcp

MCP server for Singapore work pass eligibility (COMPASS / EP / S Pass / Work Permit). Part of the DAEE fleet. Reports anonymized telemetry to the Dominion Observatory.

- Live endpoint: https://sg-workpass-compass-mcp.sgdata.workers.dev/mcp
- Health: https://sg-workpass-compass-mcp.sgdata.workers.dev/health
- Trust score: https://dominion-observatory.sgdata.workers.dev/api/trust?url=https://sg-workpass-compass-mcp.sgdata.workers.dev/mcp
- Category: compliance

## Tools

- **calculate_compass_score** — COMPASS (Complementarity Assessment Framework) scoring.
- **check_ep_eligibility** — Minimum qualifying salary + COMPASS gates for Employment Pass.
- **get_spass_quota** — S Pass quota, levy rates, salary floor by company.
- **get_work_permit_quota** — Work Permit quota and levy rates by sector.

## Pricing

Free: 5 calls/day. Starter $29 / Pro $99 / Enterprise $299 per month.

## Telemetry

Anonymized metrics reported to Dominion Observatory. PDPA + IMDA compliant.
