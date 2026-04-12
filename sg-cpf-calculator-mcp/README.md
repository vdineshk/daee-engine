# sg-cpf-calculator-mcp

Singapore CPF contribution calculator MCP server -- compute employee and employer CPF contributions, view OA/SA/MA allocation rates, calculate take-home pay, and check current CPF ceilings.

## Endpoint

```
https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp
```

## Tools

| Tool | Description |
|------|-------------|
| `calculate_cpf` | Calculate employee and employer CPF contributions given salary, age, and citizenship status |
| `get_cpf_rates` | Retrieve current CPF contribution rates by age band and residency status |
| `calculate_take_home` | Compute net take-home pay after CPF deductions and applicable tax estimates |
| `get_cpf_ceilings` | Get current Ordinary Wage and Additional Wage ceilings |

## Usage Example

```bash
curl -X POST https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "calculate_cpf",
      "arguments": {
        "monthly_salary": 6000,
        "age": 30,
        "citizenship": "citizen"
      }
    }
  }'
```

## Pricing

- **Free tier** -- rate-limited access to all tools, suitable for development and testing.
- **Paid tier** -- higher rate limits and priority support for production workloads.

## Telemetry

This server reports usage metrics to Observatory for monitoring, tracing, and analytics. No personally identifiable information is collected. See the Observatory documentation for details on data retention and opt-out configuration.
