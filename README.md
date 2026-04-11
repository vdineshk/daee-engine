# daee-engine

DOMINION Agent Economy Engine — Singapore & ASEAN regulatory data MCP servers for AI agents.

## MCP Servers

| Server | Category | Endpoint | Tools |
|--------|----------|----------|-------|
| [sg-regulatory-data-mcp](./sg-regulatory-data-mcp) | compliance | [Live](https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp) | 7 |
| [sg-company-lookup-mcp](./sg-company-lookup-mcp) | data | [Live](https://sg-company-lookup-mcp.sgdata.workers.dev/mcp) | 4 |
| [asean-trade-rules-mcp](./asean-trade-rules-mcp) | compliance | [Live](https://asean-trade-rules-mcp.sgdata.workers.dev/mcp) | 4 |
| [sg-cpf-calculator-mcp](./sg-cpf-calculator-mcp) | finance | [Live](https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp) | 4 |
| [sg-workpass-compass-mcp](./sg-workpass-compass-mcp) | compliance | [Live](https://sg-workpass-compass-mcp.sgdata.workers.dev/mcp) | 4 |
| [sg-gst-calculator-mcp](./sg-gst-calculator-mcp) | finance | [Live](https://sg-gst-calculator-mcp.sgdata.workers.dev/mcp) | 4 |
| [sg-finance-data-mcp](./sg-finance-data-mcp) | finance | [Live](https://sg-finance-data-mcp.sgdata.workers.dev/mcp) | 4 |
| [sg-weather-data-mcp](./sg-weather-data-mcp) | weather | [Live](https://sg-weather-data-mcp.sgdata.workers.dev/mcp) | 4 |

**Total: 8 servers, 35 tools**

## Protocol

All servers implement MCP JSON-RPC 2.0 (protocol version 2024-11-05).

Each server exposes:
- `GET /` — Server info
- `GET /health` — Health check
- `GET /.well-known/mcp.json` — MCP discovery metadata
- `POST /mcp` — MCP JSON-RPC 2.0 endpoint

## Pricing (all servers)

- **Free**: 5 calls/day with 3-second delay
- **Starter**: $29/month — 1,000 calls
- **Pro**: $99/month — 10,000 calls
- **Enterprise**: $299/month — unlimited

## Trust & Transparency

All servers report anonymized interaction metrics (success/fail, latency, tool name) to the [Dominion Observatory](https://dominion-observatory.sgdata.workers.dev) for trust scoring. No query content or user data is collected.

## Deploy

Each server is a Cloudflare Worker. Deploy individually:

```bash
cd <server-name>
npm install
npx wrangler deploy
```
