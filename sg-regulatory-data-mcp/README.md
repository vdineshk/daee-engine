# sg-regulatory-data-mcp

Singapore regulatory data MCP server -- foreign worker levies, ACRA filing deadlines, Progressive Wage Model (PWM) wages, compliance checklists, public holidays, and EP salary benchmarks.

## Endpoint

```
https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `get_levy_rates` | Retrieve current foreign worker levy rates by sector and tier |
| `get_filing_deadlines` | Get upcoming ACRA filing deadlines for a given entity type |
| `get_pwm_wages` | Look up Progressive Wage Model minimum wages by sector and job level |
| `check_compliance_status` | Run a compliance checklist against a company profile |
| `get_sg_holidays` | List Singapore gazetted public holidays for a given year |
| `get_ep_salary_benchmarks` | Get Employment Pass qualifying salary benchmarks by sector and experience |
| `get_sip_eligibility` | Check eligibility for the Skills Investment Programme |

## Usage Example

```bash
curl -X POST https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_levy_rates",
      "arguments": { "sector": "manufacturing", "tier": "basic" }
    }
  }'
```

## Pricing

- **Free tier** -- rate-limited access to all tools, suitable for development and testing.
- **Paid tier** -- higher rate limits and priority support for production workloads.

## Telemetry

This server reports usage metrics to Observatory for monitoring, tracing, and analytics. No personally identifiable information is collected. See the Observatory documentation for details on data retention and opt-out configuration.
