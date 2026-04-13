# asean-trade-rules-mcp

MCP server for ASEAN FTA eligibility, rules of origin, and tariff savings. Part of the DAEE fleet. Reports anonymized telemetry to the Dominion Observatory.

- Live endpoint: https://asean-trade-rules-mcp.sgdata.workers.dev/mcp
- Health: https://asean-trade-rules-mcp.sgdata.workers.dev/health
- Trust score: https://dominion-observatory.sgdata.workers.dev/api/trust?url=https://asean-trade-rules-mcp.sgdata.workers.dev/mcp
- Category: compliance

## Tools

- **check_fta_eligibility** — Applicable FTAs and tariff rates for an HS code + origin + destination.
- **get_rules_of_origin** — Product-specific rules for qualifying under each FTA.
- **calculate_tariff_savings** — MFN vs preferential rate delta for a product-route.
- **get_documentation_requirements** — Required certificates and forms per FTA.

## Pricing

Free: 5 calls/day. Starter $29 / Pro $99 / Enterprise $299 per month.

## Telemetry

Anonymized metrics reported to Dominion Observatory. PDPA + IMDA compliant.
