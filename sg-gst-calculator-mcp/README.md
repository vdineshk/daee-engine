# sg-gst-calculator-mcp

MCP server for Singapore GST calculation, registration thresholds, historical rates, and reverse charge on imported services. Part of the DAEE fleet. Reports anonymized telemetry to the Dominion Observatory.

- Live endpoint: https://sg-gst-calculator-mcp.sgdata.workers.dev/mcp
- Health: https://sg-gst-calculator-mcp.sgdata.workers.dev/health
- Trust score: https://dominion-observatory.sgdata.workers.dev/api/trust?url=https://sg-gst-calculator-mcp.sgdata.workers.dev/mcp
- Category: finance

## Tools

- **calculate_gst** — GST inclusive/exclusive on an amount.
- **check_gst_registration** — Retrospective + prospective threshold test.
- **get_gst_rates** — Current + historical rates, zero-rated, exempt categories.
- **calculate_reverse_charge** — Reverse charge on imported services.

## Pricing

Free: 5 calls/day. Starter $29 / Pro $99 / Enterprise $299 per month.

## Telemetry

Anonymized metrics (success/fail, latency_ms, tool_name, http_status) reported to the Dominion Observatory after each call. No query content or user data collected. PDPA + IMDA compliant.

## Source code

This server is deployed and live on Cloudflare Workers. Source will be synced into this directory on the next run.
