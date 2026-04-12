# DAEE Engine — MCP Server Portfolio

A collection of Model Context Protocol (MCP) servers providing Singapore and ASEAN data to AI agents. Part of the Dominion Observatory ecosystem for agent trust scoring.

## Live MCP Servers

| Server | Endpoint | Tools | Category |
|--------|----------|-------|----------|
| [SG Regulatory Data](sg-regulatory-data-mcp/) | `https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp` | 7 | compliance |
| [SG Company Lookup](sg-company-lookup-mcp/) | `https://sg-company-lookup-mcp.sgdata.workers.dev/mcp` | 4 | data |
| [ASEAN Trade Rules](asean-trade-rules-mcp/) | `https://asean-trade-rules-mcp.sgdata.workers.dev/mcp` | 4 | compliance |
| [SG CPF Calculator](sg-cpf-calculator-mcp/) | `https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp` | 4 | finance |
| [SG WorkPass COMPASS](sg-workpass-compass-mcp/) | `https://sg-workpass-compass-mcp.sgdata.workers.dev/mcp` | 4 | compliance |
| [SG GST Calculator](sg-gst-calculator-mcp/) | `https://sg-gst-calculator-mcp.sgdata.workers.dev/mcp` | 4 | finance |
| [SG Finance Data](sg-finance-data-mcp/) | `https://sg-finance-data-mcp.sgdata.workers.dev/mcp` | 4 | finance |
| [SG Weather Data](sg-weather-data-mcp/) | `https://sg-weather-data-mcp.sgdata.workers.dev/mcp` | 4 | weather |

## Quick Start

Each server implements the MCP 2024-11-05 protocol via JSON-RPC 2.0:

```bash
# List available tools
curl -X POST https://sg-gst-calculator-mcp.sgdata.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool
curl -X POST https://sg-gst-calculator-mcp.sgdata.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"calculate_gst","arguments":{"amount":100}}}'
```

## Free Tier

All servers offer 5 free calls/day per IP. Paid tiers available at $29/$99/$299 per month.

## Observatory Integration

Every server reports anonymized interaction metrics (success/fail, latency, tool name) to the [Dominion Observatory](https://dominion-observatory.sgdata.workers.dev) for trust scoring. No query content or user data is collected.

## Deployment

All servers run on Cloudflare Workers (free tier). Deploy with:

```bash
cd <server-name>
npx wrangler deploy
```

## License

Proprietary. Contact vdineshk@gmail.com for licensing.
