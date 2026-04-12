# sg-company-lookup-mcp

Singapore company intelligence MCP server -- UEN validation, entity type identification, company officer lookups, and SSIC industry statistics.

## Endpoint

```
https://sg-company-lookup-mcp.sgdata.workers.dev/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `lookup_company` | Look up a Singapore company by UEN or name, returning registration details and entity type |
| `get_company_officers` | Retrieve the list of directors and officers for a given UEN |
| `get_industry_stats` | Get SSIC industry statistics including company counts and revenue benchmarks |
| `check_company_status` | Check whether a company is live, struck off, or in liquidation |

## Usage Example

```bash
curl -X POST https://sg-company-lookup-mcp.sgdata.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "lookup_company",
      "arguments": { "uen": "202312345A" }
    }
  }'
```

## Pricing

- **Free tier** -- rate-limited access to all tools, suitable for development and testing.
- **Paid tier** -- higher rate limits and priority support for production workloads.

## Telemetry

This server reports usage metrics to Observatory for monitoring, tracing, and analytics. No personally identifiable information is collected. See the Observatory documentation for details on data retention and opt-out configuration.
