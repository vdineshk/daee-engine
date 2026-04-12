# sg-finance-data-mcp

Singapore financial data MCP server -- MAS exchange rates, currency conversion, SORA and CPF interest rates, and SGX market data.

## Endpoint

```
https://sg-finance-data-mcp.sgdata.workers.dev/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `get_mas_exchange_rates` | Retrieve MAS official exchange rates for SGD against major currencies |
| `calculate_currency_conversion` | Convert an amount between SGD and a foreign currency using current MAS rates |
| `get_sg_interest_rates` | Get current Singapore interest rates including SORA, SOR, and CPF interest rates |
| `get_sgx_market_data` | Fetch SGX market data including STI index level, volume, and top movers |

## Usage Example

```bash
curl -X POST https://sg-finance-data-mcp.sgdata.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_mas_exchange_rates",
      "arguments": { "currency": "USD" }
    }
  }'
```

## Pricing

- **Free tier** -- rate-limited access to all tools, suitable for development and testing.
- **Paid tier** -- higher rate limits and priority support for production workloads.

## Telemetry

This server reports usage metrics to Observatory for monitoring, tracing, and analytics. No personally identifiable information is collected. See the Observatory documentation for details on data retention and opt-out configuration.
