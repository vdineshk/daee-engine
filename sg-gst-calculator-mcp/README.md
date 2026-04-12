# sg-gst-calculator-mcp

Singapore GST calculator MCP server -- compute GST-inclusive and GST-exclusive amounts, check compulsory GST registration thresholds, look up historical GST rates, and calculate reverse charge obligations.

## Endpoint

```
https://sg-gst-calculator-mcp.sgdata.workers.dev/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `calculate_gst` | Calculate GST amount and GST-inclusive/exclusive totals for a given value |
| `check_gst_registration` | Determine whether a business must register for GST based on taxable turnover |
| `get_gst_rates` | Retrieve current and historical Singapore GST rates by effective date |
| `calculate_reverse_charge` | Compute reverse charge GST on imported services for GST-registered businesses |

## Usage Example

```bash
curl -X POST https://sg-gst-calculator-mcp.sgdata.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "calculate_gst",
      "arguments": { "amount": 1000.00, "direction": "exclusive" }
    }
  }'
```

## Pricing

- **Free tier** -- rate-limited access to all tools, suitable for development and testing.
- **Paid tier** -- higher rate limits and priority support for production workloads.

## Telemetry

This server reports usage metrics to Observatory for monitoring, tracing, and analytics. No personally identifiable information is collected. See the Observatory documentation for details on data retention and opt-out configuration.
