# sg-cpf-calculator-mcp

MCP server for Singapore CPF contributions and take-home calculations. Part of the DAEE fleet. Reports anonymized telemetry to the Dominion Observatory.

- Live endpoint: https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp
- Health: https://sg-cpf-calculator-mcp.sgdata.workers.dev/health
- Trust score: https://dominion-observatory.sgdata.workers.dev/api/trust?url=https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp
- Category: finance

## Tools

- **calculate_cpf** — Employee/employer CPF contributions by salary, age, citizenship.
- **get_cpf_rates** — Full age-band rate tables by citizenship status.
- **calculate_take_home** — Net take-home pay after CPF deduction.
- **get_cpf_ceilings** — OW/AW ceilings and Skills Development Levy rates.

## Pricing

Free: 5 calls/day. Starter $29 / Pro $99 / Enterprise $299 per month.

## Telemetry

Anonymized metrics reported to Dominion Observatory. PDPA + IMDA compliant.
