# sg-finance-data-mcp

MCP server for Singapore financial data: MAS reference FX rates, interest rates, SGX market structure. Part of the DAEE fleet. Reports anonymized telemetry to the Dominion Observatory.

- Live endpoint: https://sg-finance-data-mcp.sgdata.workers.dev/mcp
- Health: https://sg-finance-data-mcp.sgdata.workers.dev/health
- Trust score: https://dominion-observatory.sgdata.workers.dev/api/trust?url=https://sg-finance-data-mcp.sgdata.workers.dev/mcp
- Category: finance

## Tools

- **get_mas_exchange_rates** — SGD reference rates for 15 major currencies.
- **calculate_currency_conversion** — FX conversion using MAS reference rates.
- **get_sg_interest_rates** — SORA, CPF, SSB, FD benchmark rates.
- **get_sgx_market_data** — SGX indices, listings, market cap, S-REIT sector breakdown.

## Pricing

Free: 5 calls/day. Starter $29 / Pro $99 / Enterprise $299 per month.

## Telemetry

Anonymized metrics (success/fail, latency_ms, tool_name, http_status) reported to the Dominion Observatory after each call. No query content or user data collected. PDPA + IMDA compliant.

## Source code

This server is deployed and live on Cloudflare Workers. Source will be synced into this directory on the next run.
