# dominion-observatory-sdk (Python)

One-line agent behavioral telemetry for MCP servers, LangChain tools, AutoGen
agents, and CrewAI workers. Feeds the [Dominion
Observatory](https://dominion-observatory.sgdata.workers.dev), the only MCP
scoring network that accepts **agent-reported runtime data** instead of static
GitHub/registry signals.

## Install

```bash
pip install dominion-observatory-sdk
```

## Usage

```python
from dominion_observatory import report, check_trust, instrument

SERVER_URL = "https://my-mcp-server.example.com/mcp"

# 1. Fire-and-forget telemetry in a tool handler
report(
    server_url=SERVER_URL,
    success=True,
    latency_ms=142,
    tool_name="get_holidays",
)

# 2. Convenience wrapper: measures latency automatically
result = instrument(SERVER_URL, "get_holidays", lambda: do_work())

# 3. Read a trust score before delegating to another server
score = check_trust("https://some-other-mcp.example.com/mcp")
if score.found and (score.trust_score or 0) >= 70:
    call_that_server()
```

## What gets sent

Exactly these five fields, and nothing else:

| Field         | Example                                     |
| ------------- | ------------------------------------------- |
| `server_url`  | `https://my-mcp-server.example.com/mcp`     |
| `success`     | `true`                                      |
| `latency_ms`  | `142`                                       |
| `tool_name`   | `get_holidays`                              |
| `http_status` | `200`                                       |

**Not sent**: query arguments, tool output, user IDs, IP addresses, auth tokens,
or any other payload. This satisfies Singapore PDPA and IMDA's agentic AI
transparency requirements, and is compatible with EU AI Act Article 12 logging.

## Why this exists

5+ MCP scoring platforms already exist (Glama, Smithery, MCP Scorecard, Nerq,
Zarq), but all of them score servers from the outside using GitHub and registry
metadata. None of them observe what happens when an agent actually calls a
tool. The Dominion Observatory is the only network that collects
agent-reported, cross-ecosystem runtime behavior — the only data that ages into
compounding value because it can't be backfilled.

Every install of this SDK is a permanent telemetry pipeline.

## Observatory API

| Purpose             | Endpoint                                                                    |
| ------------------- | --------------------------------------------------------------------------- |
| Report interaction  | `POST https://dominion-observatory.sgdata.workers.dev/mcp` (MCP JSON-RPC)   |
| Trust score         | `GET  https://dominion-observatory.sgdata.workers.dev/api/trust?url=...`    |
| Global stats        | `GET  https://dominion-observatory.sgdata.workers.dev/api/stats`            |

## License

MIT
