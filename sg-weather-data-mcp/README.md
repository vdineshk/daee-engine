# sg-weather-data-mcp

Singapore weather data MCP server -- live weather forecasts, PSI air quality readings, 4-day outlook, and ASEAN regional climate summaries.

## Endpoint

```
https://sg-weather-data-mcp.sgdata.workers.dev/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `get_sg_weather_now` | Get the current weather conditions across Singapore regions |
| `get_sg_psi` | Retrieve the latest PSI (Pollutant Standards Index) and PM2.5 air quality readings |
| `get_sg_forecast` | Get the NEA 4-day weather forecast for Singapore |
| `get_asean_climate` | Fetch regional climate summaries for ASEAN capital cities |

## Usage Example

```bash
curl -X POST https://sg-weather-data-mcp.sgdata.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_sg_weather_now",
      "arguments": {}
    }
  }'
```

## Pricing

- **Free tier** -- rate-limited access to all tools, suitable for development and testing.
- **Paid tier** -- higher rate limits and priority support for production workloads.

## Telemetry

This server reports usage metrics to Observatory for monitoring, tracing, and analytics. No personally identifiable information is collected. See the Observatory documentation for details on data retention and opt-out configuration.
