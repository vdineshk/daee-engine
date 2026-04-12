# sg-workpass-compass-mcp

Singapore work pass MCP server -- COMPASS framework scoring for Employment Pass applications, EP eligibility checks, S Pass dependency ratio quotas, and Work Permit levy tiers.

## Endpoint

```
https://sg-workpass-compass-mcp.sgdata.workers.dev/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `calculate_compass_score` | Calculate the COMPASS (Complementarity Assessment Framework) score for an EP application |
| `check_ep_eligibility` | Check Employment Pass eligibility based on salary, qualifications, and company profile |
| `get_spass_quota` | Retrieve current S Pass sub-dependency ratio ceiling and available quota for a company |
| `get_work_permit_quota` | Get Work Permit dependency ratio ceiling and levy rates by sector |

## Usage Example

```bash
curl -X POST https://sg-workpass-compass-mcp.sgdata.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "calculate_compass_score",
      "arguments": {
        "salary": 8000,
        "qualifications": "bachelors",
        "sector": "technology",
        "nationality_diversity": true
      }
    }
  }'
```

## Pricing

- **Free tier** -- rate-limited access to all tools, suitable for development and testing.
- **Paid tier** -- higher rate limits and priority support for production workloads.

## Telemetry

This server reports usage metrics to Observatory for monitoring, tracing, and analytics. No personally identifiable information is collected. See the Observatory documentation for details on data retention and opt-out configuration.
