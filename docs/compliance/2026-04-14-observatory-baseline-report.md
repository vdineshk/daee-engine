# Observatory Baseline Report — 2026-04-14

**Source**: [dominion-observatory.sgdata.workers.dev/api/compliance](https://dominion-observatory.sgdata.workers.dev/api/compliance?start_date=2026-04-14)
**Generated**: 2026-04-14 08:21 UTC
**Framework alignment**: EU AI Act Article 12 · Singapore IMDA Agentic AI Governance Framework
**Status**: Baseline (data accumulation phase — see provenance below)

---

## Summary

| Metric | Value |
|---|---|
| Total interactions (24h window) | 588 |
| Total interactions (lifetime) | 602 |
| Distinct servers probed | 8 (Builder) + N external |
| Distinct agents reporting | 2 (`observatory_probe`, `anonymous`) |
| Success rate | 100% (all observed) |
| Average latency (health checks) | 3–5 ms |
| Average latency (tool calls) | 200–3,300 ms |
| Compliance framework coverage | 2 (EU AI Act Art. 12, IMDA) |
| Data collection start | 2026-04-08 |

## Provenance split (honest)

```
observatory_probe          ~87   (Observatory active probes, */15 cron)
anonymous (_keeper_*)      ~493  (flywheel-keeper synthetic healthchecks)
anonymous (real tool_name) ~8    (April 14 telemetry verification run)
external agent (SDK)       0     (waiting on first install)
```

This report documents the *export format* for EU AI Act Art. 12 / IMDA
compliance logging against MCP servers. The data currently reflects
Observatory self-probing and Builder-owned baseline traffic, not
production external agent behaviour. Format is stable; source mix will
shift as `dominion-observatory-sdk` installs grow.

## Category coverage (Builder servers)

| Category | Servers | Sample avg latency |
|---|---|---|
| finance | sg-finance-data-mcp, sg-gst-calculator-mcp | 4 ms (health) / ~200 ms (tools) |
| data | sg-regulatory-data-mcp, sg-cpf-calculator-mcp, sg-workpass-compass-mcp, asean-trade-rules-mcp, sg-company-lookup-mcp | 3–4 ms (health) |
| weather | sg-weather-data-mcp | 4 ms (health) |

## Record schema (EU AI Act Art. 12 minimums mapped)

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

Maps to Art. 12(2) logging requirements:
- `timestamp` → period of use
- `server.url` + `server.name` → system identity
- `agent_id` → reference database / user identity
- `tool_called` → input data / operation
- `outcome.success`, `outcome.http_status`, `error` → situation detection /
  identification of persons

## What's missing (roadmap)

1. **Real agent data** — triggered by `dominion-observatory-sdk` installs
   (PyPI live, npm blocked on 2FA token type)
2. **Builder server probing via service bindings** — Cloudflare same-zone
   fetch returns 404 to calling Worker's edge (see Brain directive #1)
3. **Anomaly flags** — structured deviation from category baselines
4. **Signed exports** — cryptographic attestation for regulator submission

## Integrity checks

- No edits, aggregation, or filtering beyond the date window
- Snapshot hash: `sha256sum docs/compliance/2026-04-14-observatory-baseline-snapshot.json`
  (run locally to verify)
- Endpoint is append-only; interaction IDs are monotonic
