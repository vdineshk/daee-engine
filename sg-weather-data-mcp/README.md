# sg-weather-data-mcp

MCP server for Singapore weather and ASEAN climate — live NEA 2-hour forecasts, PSI air quality, 24-hour/4-day forecasts via data.gov.sg, and ASEAN regional climate data for all 10 member states.

## Endpoint

`https://sg-weather-data-mcp.sgdata.workers.dev/mcp`

## Tools (4)

| Tool | Description |
|------|-------------|
| `get_sg_weather_now` | Live 2-hour weather forecast for all 47 Singapore areas from NEA |
| `get_sg_psi` | Live PSI air quality readings for north/south/east/west/central regions |
| `get_sg_forecast` | 24-hour and 4-day weather forecast for Singapore |
| `get_asean_climate` | ASEAN regional climate — monsoons, dry/wet patterns, typhoon risk, travel months |

## Protocol

- MCP JSON-RPC 2.0 (protocol version 2024-11-05)
- Endpoints: `GET /` | `GET /health` | `GET /.well-known/mcp.json` | `POST /mcp`

## Data Sources

- NEA (National Environment Agency) via data.gov.sg — live weather data
- Regional climate databases — ASEAN monsoon and weather patterns

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
