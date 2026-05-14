<div align="center">

# DAEE Engine

**Dominion Agent Economy Engine**

The infrastructure layer for autonomous agents that earn, transact, and build trust in the open economy.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Observatory](https://img.shields.io/badge/Observatory-Live-brightgreen)](https://dominion-observatory.sgdata.workers.dev)
[![x402 Extension](https://img.shields.io/badge/x402-Trust%20Provider-orange)](https://github.com/x402-foundation/x402/pull/2300)

</div>

---

## What is this?

DAEE is a monorepo powering the **Dominion** ecosystem — a set of MCP servers, trust infrastructure, and settlement tooling that lets AI agents operate as first-class economic actors.

**The problem:** Agents need to pay for APIs, but there's no way to know if the agent on the other side is trustworthy before settling a payment.

**Our solution:** Behavioral trust scoring that plugs directly into the payment flow.

```
Agent A wants to call a paid API
    │
    ▼
┌─────────────────────┐
│  x402 Payment Flow  │
│                     │
│  beforeSettle hook  │──► Query Dominion Observatory
│                     │       │
│  Trust score: 82    │◄──────┘
│  Decision: PASS     │
│                     │
│  Settlement: GO     │──► USDC transfer on Base
└─────────────────────┘
```

## Architecture

| Component | What it does |
|-----------|-------------|
| **[Dominion Observatory](dominion-observatory/)** | Live behavioral trust registry — tracks interaction history, latency, success rates for MCP servers. [Try it →](https://dominion-observatory.sgdata.workers.dev) |
| **[x402 Trust-Provider Extension](packages/trust-provider/)** | Plugs Observatory data into x402's `onBeforeSettle` hook. Gates payments on trust. [PR →](https://github.com/x402-foundation/x402/pull/2300) |
| **[LangChain Trust Gate](packages/langchain-trust-gate/)** | Drop-in LangChain tool — `TrustGateTool` for agent pipelines |
| **[Testnet Demo](testnet-demo/)** | End-to-end: Observatory query → trust gate → USDC transfer on Base Sepolia |
| **[Trust-Provider Spec](specs/x402-trust-provider-interface/)** | Formal spec (v0.1) for the trust-provider interface |

## MCP Servers (Live)

Production MCP servers powering Singapore government data for AI agents:

| Server | Domain | Status |
|--------|--------|--------|
| [sg-cpf-calculator](sg-cpf-calculator-mcp/) | CPF contributions, age-banded rates, OA/SA/MA allocation | ✅ Live |
| [sg-company-lookup](sg-company-lookup-mcp/) | UEN validation, ACRA lookups, officer data, SSIC codes | ✅ Live |
| [sg-regulatory-data](sg-regulatory-data-mcp/) | Levy rates, filing deadlines, EP benchmarks, holidays | ✅ Live |
| [sg-workpass-compass](sg-workpass-compass-mcp/) | Employment Pass COMPASS scoring | ✅ Live |
| [asean-trade-rules](asean-trade-rules-mcp/) | ASEAN trade regulations and tariff data | ✅ Live |

All servers are registered on the [Dominion Observatory](https://dominion-observatory.sgdata.workers.dev/api/stats) with behavioral trust scores.

## Quick start

### Try the trust gate (no wallet needed)

```bash
cd testnet-demo
npm install
npm run demo:dry-run
```

### Use in LangChain

```python
from langchain_trust_gate import TrustGateTool

tool = TrustGateTool()
result = tool.invoke({"agent_id": "sg-cpf-calculator"})
# {'decision': 'PASS', 'score': 0.82, ...}
```

### Use in TypeScript

```typescript
import { observatoryEvaluate } from "@dominion/trust-provider";

const evaluation = await observatoryEvaluate({
  schema: "x402-trust-query-v0.1",
  payer: { agent_id: "sg-cpf-calculator" },
  resource: { url: "https://api.example.com/data", method: "GET" },
  requested_at: new Date().toISOString(),
});

if (evaluation.decision === "PASS") {
  // proceed with payment settlement
}
```

### Query the Observatory directly

```bash
curl https://dominion-observatory.sgdata.workers.dev/api/agent-query/sg-cpf-calculator
```

### Embed a trust badge

Display your MCP server's live trust score as a badge in any README or documentation:

```markdown
![Trust Score](https://dominion-observatory.sgdata.workers.dev/badge/your-server-slug)
```

Examples with real servers:

```markdown
![Trust Score](https://dominion-observatory.sgdata.workers.dev/badge/sg-cpf-calculator)
```

The badge auto-updates every 5 minutes and is color-coded:

| Color | Score | Decision |
|-------|-------|----------|
| Green | 60+ | PASS |
| Yellow | 40-59 | UNCERTAIN |
| Red | < 40 | FAIL |
| Gray | — | Server not found |

Use it in your MCP server's README to signal trust to consumers.

## How trust scoring works

The Observatory tracks behavioral attestation data for every registered MCP server:

| Signal | What it measures |
|--------|-----------------|
| Interaction count | How much real usage the server has |
| Success rate | Reliability under real-world conditions |
| Avg latency | Performance consistency |
| Registration age | Time-based trust accumulation |

These signals produce a **trust score** (0-100) mapped to decisions:

| Score | Decision | Tier |
|-------|----------|------|
| 60+ | `PASS` | Silver+ — proceed with settlement |
| 40-59 | `UNCERTAIN` | Review band — apply extra checks |
| <40 | `FAIL` | Below Bronze — block settlement |

## Integrations

- **[x402 Protocol](https://github.com/x402-foundation/x402)** — Trust-provider extension for payment gating ([PR #2300](https://github.com/x402-foundation/x402/pull/2300))
- **[LangChain](https://github.com/langchain-ai/langchain)** — `TrustGateTool` for agent pipelines
- **[Model Context Protocol](https://github.com/modelcontextprotocol/modelcontextprotocol)** — All servers are MCP-native ([Discussion #2720](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/2720))

## Packages

| Package | Registry | Description |
|---------|----------|-------------|
| `@dominion/trust-provider` | npm | TypeScript trust-provider with Observatory adapter |
| `langchain-trust-gate` | PyPI | LangChain tool for behavioral trust scoring |

## Project structure

```
daee-engine/
├── dominion-observatory/       # Trust registry (Cloudflare Workers)
├── packages/
│   ├── trust-provider/         # npm: @dominion/trust-provider
│   └── langchain-trust-gate/   # PyPI: langchain-trust-gate
├── specs/                      # Formal specifications
├── testnet-demo/               # x402 + Base Sepolia demo
├── sg-cpf-calculator-mcp/      # MCP server: CPF
├── sg-company-lookup-mcp/      # MCP server: Company data
├── sg-regulatory-data-mcp/     # MCP server: Regulatory
├── sg-workpass-compass-mcp/    # MCP server: Work passes
├── asean-trade-rules-mcp/      # MCP server: ASEAN trade
├── benchmarks/                 # Performance benchmarks
├── decisions/                  # Architecture decision records
└── docs/                       # Documentation
```

## Contributing

PRs welcome. See individual package READMEs for development setup.

## License

MIT
