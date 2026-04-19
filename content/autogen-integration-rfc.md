# AutoGen Integration RFC — Dominion Observatory Trust Layer

**Status:** DRAFT — scope + first PR plan. Do not open PR until LangChain callback handler shows external pickup OR D14 trigger fires.
**Target repo:** `microsoft/autogen`
**Author:** vdineshk
**Branch lock note:** harness on `claude/wizardly-brown-6DWJh` this run; Strategist override required before any cross-repo PR opens.

---

## Why AutoGen next

LangChain integration shipped as `dominion-observatory-langchain==0.1.0` on 2026-04-15. Four days post-publish, zero non-Builder pip installs detectable in our telemetry stream. The LangChain RFC #35691 reserved a slot for `vdineshk — Dominion Observatory` (per Strategist sweep 2026-04-19), which is the strongest demand signal we have on that ecosystem; AutoGen is the natural second axis because:

1. AutoGen agents call MCP servers via `mcp_server_tools()` adapter (autogen-ext) — single integration point.
2. Microsoft Research stewardship → EU AI Act Article 50 readiness will land as a feature request, not a nice-to-have.
3. AutoGen's agent registry pattern (`AgentRuntime`) is closer to our trust-scoring model than LangChain's callback chain.

## What we ship

A `TrustedMCPServerTools` wrapper around `autogen_ext.tools.mcp.mcp_server_tools` that:

1. On tool registration, fetches `GET https://dominion-observatory.sgdata.workers.dev/api/trust/<server_url>` and attaches the score as tool metadata.
2. On every tool invocation, fires-and-forgets a telemetry POST with `{tool_name, latency_ms, success, agent_id}` — never blocks the call.
3. Exposes a `min_trust_score` parameter that short-circuits low-trust calls before the network roundtrip (default `None` = no enforcement, opt-in only).
4. Adds an `observatory_metadata` field to every tool response containing `{trust_score_url, telemetry_disclosed: true, policy_source: "dominion-observatory@0.1.0"}`.

## Why opt-in enforcement matters

Forcing trust thresholds will get the PR rejected. Microsoft will not merge a third-party gatekeeper into the core tool path. Opt-in metadata + voluntary enforcement is the only mergeable shape.

## PR scope (single PR, ~250 LoC)

- `autogen-ext/src/autogen_ext/tools/mcp/_observatory.py` — wrapper class + telemetry client
- `autogen-ext/tests/tools/mcp/test_observatory.py` — 4 tests: registration, telemetry fire, threshold short-circuit, fallback when Observatory unreachable
- `autogen-ext/pyproject.toml` — add `dominion-observatory-sdk` as optional dep under `[project.optional-dependencies] observatory`
- `docs/src/user-guide/extensions-user-guide/observatory.md` — 1-page docs with copy-paste example
- `python/CHANGELOG.md` — entry under "Unreleased"

**Explicitly NOT in scope:**
- Modifying core `mcp_server_tools` — wrapper only
- Default-on enforcement
- Any change to AgentRuntime
- Renaming or moving existing files

## Pre-requisites that must ship first

1. PyPI `dominion-observatory-sdk` package must actually exist (currently 404). Brain claim drift caught by Strategist 2026-04-19. **Builder cannot open the AutoGen PR until pip install succeeds end-to-end.** Action: ship `dominion-observatory-sdk==0.1.0` to PyPI from the existing TypeScript-companion Python source in `dominion-observatory-sdk/python/`, with the same agent_id-required + correct UA fix as `dominion-observatory-langchain` 0.1.0.
2. `/api/trust/<server_url>` endpoint must accept URL-encoded server URLs (current implementation uses server_id only). Action: add URL-encoded resolver, ~40 LoC, no migration needed.
3. Methodology page must list AutoGen in the "Supported Frameworks" matrix before the PR opens — reviewers check.

## Maintainer outreach (before PR)

Open an `autogen` discussion (NOT an issue) titled `Discussion: optional behavioral trust scoring for MCP server tools` linking to the Observatory and asking whether the maintainers would be receptive to an opt-in metadata wrapper. **Do not write any code until at least one maintainer responds positively.** This is the WHAT FAILS lesson from RUN-009 (LangChain feature request opened without prior maintainer ack stalled for 6 days; the threads that worked had pre-discussion).

## Kill criteria

- Discussion open >7 days, zero maintainer response → AutoGen is dead, pivot to CrewAI (smaller maintainer set, faster turnaround historically)
- Discussion gets a "no, out of scope" → defer 90 days, ship as standalone `autogen-observatory` package on PyPI instead
- Discussion gets "yes, but use this other integration point" → adapt scope, do not argue the design

## Honest competitive read

If anyone else ships an AutoGen-MCP-trust integration first, this PR is dead. The window is the gap between EU AI Act Article 50 entering the AutoGen issue tracker and Microsoft shipping their own answer. Estimated window: 2026-05 to 2026-08. Move accordingly.
