# langchain-trust-gate

LangChain tool for behavioral trust scoring via [Dominion Observatory](https://dominion-observatory.sgdata.workers.dev).

Gate agent actions on real behavioral attestation data — interaction history, success rates, latency — before executing sensitive operations.

## Install

```bash
pip install langchain-trust-gate
```

## Quick start

```python
from langchain_trust_gate import TrustGateTool, check_trust

# As a LangChain tool (drop into any agent)
tool = TrustGateTool()
result = tool.invoke({"agent_id": "sg-cpf-calculator"})
# {'decision': 'PASS', 'score': 0.82, 'raw_score': 82, ...}

# Direct async call
evaluation = await check_trust("sg-cpf-calculator")
if evaluation["decision"] == "PASS":
    # proceed with operation
    pass
```

## With a LangChain agent

```python
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI
from langchain_trust_gate import TrustGateTool

llm = ChatOpenAI(model="gpt-4")
tools = [TrustGateTool()]

agent = initialize_agent(
    tools, llm, agent=AgentType.OPENAI_FUNCTIONS, verbose=True
)

agent.run("Check the trust score of the sg-cpf-calculator agent")
```

## Decision thresholds

| Score (0-100) | Decision    | Meaning                          |
|---------------|-------------|----------------------------------|
| >= 60         | `PASS`      | Silver tier or above — proceed   |
| 40-59         | `UNCERTAIN` | Review band — apply extra checks |
| < 40          | `FAIL`      | Below Bronze — block operation   |

Thresholds are configurable:

```python
tool = TrustGateTool(pass_threshold=70, fail_threshold=30)
```

## API

### `TrustGateTool`

LangChain `BaseTool` subclass. Configurable fields:

| Field            | Type   | Default | Description                      |
|------------------|--------|---------|----------------------------------|
| `base_url`       | `str`  | Observatory URL | API endpoint          |
| `pass_threshold` | `int`  | `60`    | Minimum score for PASS           |
| `fail_threshold` | `int`  | `40`    | Scores below this are FAIL       |
| `timeout`        | `float`| `5.0`   | HTTP timeout in seconds          |

### `check_trust(agent_id, **kwargs) -> TrustEvaluation`

Async function for direct use outside LangChain.

### `check_trust_sync(agent_id, **kwargs) -> TrustEvaluation`

Synchronous wrapper.

### `TrustEvaluation`

TypedDict with fields:
- `decision`: `"PASS"` | `"FAIL"` | `"UNCERTAIN"`
- `score`: `float | None` — normalized 0.0-1.0
- `raw_score`: `int | None` — raw 0-100 from Observatory
- `reason_code`: `str` — machine-readable reason
- `evidence_uri`: `str | None` — link to Observatory evidence page
- `provider`: `str` — always `"dominion-observatory"`
- `agent_id`: `str`
- `evaluated_at`: `str` — ISO 8601 timestamp

## Spec reference

- [x402 Trust-Provider Interface v0.1](https://github.com/vdineshk/daee-engine/blob/main/specs/x402-trust-provider-interface/v0.1/SPEC.md)
- [Dominion Observatory](https://dominion-observatory.sgdata.workers.dev)

## License

MIT
