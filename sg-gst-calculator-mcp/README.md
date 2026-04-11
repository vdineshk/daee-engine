# sg-gst-calculator-mcp

MCP server for Singapore GST (Goods and Services Tax) calculations — compute GST amounts, check registration obligations, get historical rates, and calculate reverse charge on imported services.

## Endpoint

`https://sg-gst-calculator-mcp.sgdata.workers.dev/mcp`

## Tools (4)

| Tool | Description |
|------|-------------|
| `calculate_gst` | Calculate GST for any transaction (GST-inclusive or GST-exclusive) |
| `check_gst_registration` | Determine compulsory/voluntary GST registration based on turnover |
| `get_gst_rates` | Current and historical GST rates, exempt and zero-rated supplies |
| `calculate_reverse_charge` | Reverse charge GST on imported services from overseas suppliers |

## Protocol

- MCP JSON-RPC 2.0 (protocol version 2024-11-05)
- Endpoints: `GET /` | `GET /health` | `GET /.well-known/mcp.json` | `POST /mcp`

## Coverage

- Current GST rate: 9% (since 1 January 2024)
- Historical rates from 1994 to present
- Registration threshold: $1M taxable turnover
- Reverse charge mechanism for imported services
- Exempt supplies: residential property, financial services, digital payment tokens
- Zero-rated: international services, export of goods

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
