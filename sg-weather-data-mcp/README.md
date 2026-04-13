# sg-weather-data-mcp

MCP server for Singapore and ASEAN weather: NEA 2-hour nowcast, PSI air quality, 24h/4-day forecast, ASEAN climate. Part of the DAEE fleet. Reports anonymized telemetry to the Dominion Observatory.

- Live endpoint: https://sg-weather-data-mcp.sgdata.workers.dev/mcp
- Health: https://sg-weather-data-mcp.sgdata.workers.dev/health
- Trust score: https://dominion-observatory.sgdata.workers.dev/api/trust?url=https://sg-weather-data-mcp.sgdata.workers.dev/mcp
- Category: weather

## Tools

- **get_sg_weather_now** — NEA 2-hour nowcast, optionally area-filtered.
- **get_sg_psi** — Current PSI air quality readings with health guidance.
- **get_sg_forecast** — 24-hour or 4-day general forecast, temperature, humidity, wind.
- **get_asean_climate** — ASEAN temperature, rainfall, monsoon seasons, natural hazards.

## Pricing

Free: 5 calls/day. Starter $29 / Pro $99 / Enterprise $299 per month.

## Telemetry

Anonymized metrics (success/fail, latency_ms, tool_name, http_status) reported to the Dominion Observatory after each call. No query content or user data collected. PDPA + IMDA compliant.

## Source code

This server is deployed and live on Cloudflare Workers. Source will be synced into this directory on the next run.
