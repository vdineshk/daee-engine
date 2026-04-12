# asean-trade-rules-mcp

ASEAN trade rules MCP server -- RCEP, CPTPP, and AFTA free trade agreement eligibility checks, rules of origin lookups, tariff savings calculations, and documentation requirements.

## Endpoint

```
https://asean-trade-rules-mcp.sgdata.workers.dev/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `check_fta_eligibility` | Determine which FTAs (RCEP, CPTPP, AFTA, bilateral) apply to a given trade route and product |
| `get_rules_of_origin` | Retrieve rules of origin criteria for a product under a specific FTA |
| `calculate_tariff_savings` | Estimate tariff savings when shipping under a preferential FTA vs. MFN rates |
| `get_documentation_requirements` | List required certificates and forms for a given FTA and shipment |

## Usage Example

```bash
curl -X POST https://asean-trade-rules-mcp.sgdata.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "check_fta_eligibility",
      "arguments": {
        "origin_country": "SG",
        "destination_country": "JP",
        "hs_code": "8471.30"
      }
    }
  }'
```

## Pricing

- **Free tier** -- rate-limited access to all tools, suitable for development and testing.
- **Paid tier** -- higher rate limits and priority support for production workloads.

## Telemetry

This server reports usage metrics to Observatory for monitoring, tracing, and analytics. No personally identifiable information is collected. See the Observatory documentation for details on data retention and opt-out configuration.
