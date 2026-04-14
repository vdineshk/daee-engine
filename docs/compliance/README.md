# Dominion Observatory — Compliance Report Artifacts

This directory contains live exports from the Observatory's compliance endpoint
(`/api/compliance`), which formats agent-to-MCP-server interaction logs against
two frameworks:

- **EU AI Act Article 12** — automatic event logging for high-risk AI systems
- **Singapore IMDA Agentic AI Governance Framework** (January 2026)

These artifacts are the first publicly available runtime behavioral logs for
the MCP ecosystem formatted against either framework.

## What each file is

- `2026-04-14-observatory-baseline-snapshot.json` — raw export from the live
  endpoint at 2026-04-14 08:21 UTC. 588 records, single-day window.
- `2026-04-14-observatory-baseline-report.md` — human-readable summary of the
  snapshot with honest provenance labelling.

## Honest provenance note

As of 2026-04-14, the Observatory is in **data accumulation phase**.
Records fall into three source categories, each labelled in `agent_id`:

1. `observatory_probe` — active reachability probes run by the Observatory
   on a `*/15 * * * *` cron against public MCP endpoints.
2. `anonymous` via `_keeper_healthcheck` — synthetic health checks from
   `flywheel-keeper` cron against Builder-owned servers, used to establish
   baseline latency and uptime.
3. `anonymous` via real tool names (e.g. `calculate_cpf`, `lookup_company`) —
   verification calls from the April 14 telemetry audit (8 calls).

**No external agent has installed `dominion-observatory-sdk` and reported a
live interaction yet.** These reports therefore document the *format* and
*plumbing* of compliance export, not production agent behaviour. The format
is identical to what real agent data will produce; only the source mix will
change.

## Live endpoint

```
GET https://dominion-observatory.sgdata.workers.dev/api/compliance
    ?start_date=YYYY-MM-DD
    &end_date=YYYY-MM-DD
    &server_url=...
    &agent_id=...
    &limit=N
```

Returns JSON conforming to EU AI Act Art. 12 logging minimums (timestamp,
system identity, tool invocation, outcome, error, latency).

## Regeneration

To produce a fresh snapshot:

```bash
curl -sS "https://dominion-observatory.sgdata.workers.dev/api/compliance?start_date=$(date -u +%Y-%m-%d)" \
  > docs/compliance/$(date -u +%Y-%m-%d)-observatory-snapshot.json
```
