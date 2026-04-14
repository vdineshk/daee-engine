---
title: "I exported the first MCP server interaction log in EU AI Act Article 12 format — here's what it looks like"
published: false
description: "The EU AI Act deadline for high-risk AI logging is August 2, 2026. No MCP scoring platform offers compliance-shaped exports. So I shipped one."
tags: mcp, ai, compliance, observability
canonical_url:
cover_image:
---

> **TL;DR** — The EU AI Act Article 12 deadline for high-risk AI logging is
> August 2, 2026. Singapore's IMDA Agentic AI Framework is already in force
> (January 2026). I run an MCP server observability project called Dominion
> Observatory, and as of today it exports agent-to-server interaction logs
> in a JSON shape aligned to both frameworks. One live endpoint. One SDK.
> MIT. Published snapshot below. It is the first one I am aware of for MCP.

## The gap nobody in the MCP scoring space has filled

If you've been tracking the "who rates MCP servers" question over the last
few months, the list is getting long: Glama, Smithery, MCP Scorecard, Nerq,
Zarq, BlueRock. They do different things well. None of them do this:

| Capability | Glama | Smithery | MCP Scorecard | Nerq | Zarq | BlueRock | Dominion Observatory |
|---|---|---|---|---|---|---|---|
| Static repo/registry scoring | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Runtime security sensors | — | — | — | — | — | ✅ | — |
| **Cross-ecosystem agent-reported telemetry** | — | — | — | — | — | — | **✅** |
| **EU AI Act Art. 12 export format** | — | — | — | — | — | — | **✅** |
| **Singapore IMDA framework alignment** | — | — | — | — | — | — | **✅** |

I am not claiming the above stack is "bad". Static scoring, security
sensors, and compliance exports solve different problems for different
buyers. I am claiming one narrow thing: if you need a compliance-shaped
log of which agent called which tool on which MCP server with what outcome
and latency, nobody is shipping that today. So I shipped it.

## What the export looks like

One record:

```json
{
  "interaction_id": 602,
  "timestamp": "2026-04-14 08:15:33",
  "server": {
    "url": "https://sg-finance-data-mcp.sgdata.workers.dev/mcp",
    "name": "sg-finance-data-mcp",
    "category": "finance"
  },
  "agent_id": "anonymous",
  "tool_called": "_keeper_healthcheck",
  "outcome": {
    "success": true,
    "http_status": 200,
    "latency_ms": 4
  },
  "error": null
}
```

One endpoint:

```
GET https://dominion-observatory.sgdata.workers.dev/api/compliance
    ?start_date=2026-04-14
    &end_date=2026-04-14
```

Returns a framework wrapper plus the interaction array. Maps directly to the
Article 12(2) logging minimums: period of use, system identity, operation,
outcome, error detection.

Full snapshot for 2026-04-14 (588 records, 272 KB) lives in the repo:
[`docs/compliance/2026-04-14-observatory-baseline-snapshot.json`](https://github.com/vdineshk/daee-engine/blob/main/docs/compliance/2026-04-14-observatory-baseline-snapshot.json)

The human-readable writeup with the full schema mapping:
[`docs/compliance/2026-04-14-observatory-baseline-report.md`](https://github.com/vdineshk/daee-engine/blob/main/docs/compliance/2026-04-14-observatory-baseline-report.md)

## The honest part

I want to be straight about what this report *is* and *isn't* in April 2026.

**What it is.** A working, live endpoint that formats real interactions —
every probe, every health check, every tool call — against the EU AI Act
Art. 12 and Singapore IMDA schemas. The plumbing works end-to-end.
Append-only. Monotonic IDs. Timestamped. Filterable.

**What it isn't, yet.** Production agent data. Of the 602 interactions in
the log today, roughly 87 are Observatory active probes and the bulk of the
rest are synthetic health checks from a flywheel-keeper cron I run against
my own eight Builder servers. Eight calls are from yesterday's telemetry
audit. Zero are from an external agent that installed the SDK and called a
tool in the wild.

Why am I telling you this in the same post where I'm announcing the thing?
Because the alternative — dressing synthetic traffic up as production
compliance data — would be worse than shipping nothing. The format is real.
The pipeline is real. The external agent data is not there yet. That's the
part I need your help with.

## How to put real data in it (3 lines of Python)

The SDK is live on PyPI today. npm is blocked on a token regeneration, so
TypeScript folks — use the CDN drop for one more day.

```bash
pip install dominion-observatory-sdk
```

```python
from dominion_observatory import report

# after your MCP tool call succeeds or fails
report(
    server_url="https://your-mcp-server.example.com/mcp",
    success=True,
    latency_ms=142,
    tool_name="lookup_entity",
)
```

That's the whole integration. Fire-and-forget. No API key. MIT licensed.
The only thing the Observatory collects is what you see in the record
schema above — no payloads, no tool arguments, no agent identity unless
you pass one.

TypeScript users (npm pending, CDN available):

```html
<script type="module">
  import { report } from "https://sdk-cdn.sgdata.workers.dev/v1/observatory.js";
  report({ server_url: "...", success: true, latency_ms: 142, tool_name: "..." });
</script>
```

## Why I'm building this

Two deadlines are on my calendar:

- **Singapore IMDA Agentic AI Governance Framework** — live since January 2026.
- **EU AI Act Article 12** — automatic event logging required for high-risk
  AI systems from August 2, 2026.

Both ask the same question in different words: *for every AI system you
deploy, can you produce a timestamped log of what it did and how it
behaved?* For MCP servers and the agents that call them, the answer today
is "not in any standard shape you could hand to a regulator".

That's the gap. One log format. One SDK. One live endpoint. Published
under MIT so this becomes the default shape of the answer before a vendor
pins it inside a paid tier.

## What I'd love from you

If you run an MCP server, or you're building an agent that calls them:

1. **Install the SDK on one call path.** Let it fire-and-forget reports for
   a week. Tell me what breaks.
2. **Pull a compliance snapshot** for your server:
   `curl .../api/compliance?server_url=YOURS`
3. **Tell me where the format is wrong.** I have not submitted this to a
   regulator. I have read the frameworks. I would much rather know about a
   mismatch now than in August.

Repo: [vdineshk/daee-engine](https://github.com/vdineshk/daee-engine)
(the `dominion-observatory-sdk/` and `docs/compliance/` directories are
what this post is about)

Reply here or open an issue. If you're at an enterprise dealing with
EU AI Act logging for agentic systems and want to pilot this with real
data, I'm at vdineshk@gmail.com.

---

*Built in Singapore. MIT licensed. All telemetry is anonymized — the SDK
reports success/fail, latency_ms, and tool_name only. No payloads, no
arguments, no agent identity unless you pass one. Compliant with
Singapore PDPA and aligned with the IMDA Agentic AI Governance Framework.*
