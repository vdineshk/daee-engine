# Show HN: I tracked 4,584 MCP servers for 30 days — here's what 15K interactions actually look like

**Status:** DRAFT for human review/posting (Dinesh). Do not post until reviewed.
**Numbers refreshed:** 2026-04-21 (RUN-017 BUILDER).
**Author:** vdineshk@gmail.com
**Target:** news.ycombinator.com/submit
**Best post window:** Tue–Thu 08:30–09:30 SGT (00:30–01:30 UTC) to hit US morning.

---

## Title

`Show HN: I tracked 4,584 MCP servers for 30 days — here's what the data shows`

(Alt: `Show HN: Dominion Observatory – runtime trust scores for 4,584 MCP servers`)

## URL

`https://dominion-observatory.sgdata.workers.dev`

## Body (first comment, posted immediately after submission)

Six weeks ago I started indexing every Model Context Protocol server I could find — Smithery, mcp.so, Glama, the official registry, GitHub. I built a Cloudflare Worker that pings declared health endpoints, captures real tool-call telemetry from any agent that opts in via a 3-line SDK, and computes a behavioral trust score per server.

Today the index has **4,584 servers**, **15,614 recorded interactions**, and a public stats endpoint at `/api/stats`.

I want to share what's in the data — including the unflattering parts — because every other "MCP directory" I've seen reports static metadata (stars, install count, vendor claims) and none of them publish runtime evidence.

**What the data actually says (verified 2026-04-21):**

- **2,451 interactions in the last 24h.** Of those, 2,355 are agent-reported via the SDK and 96 are my own probes. Honest provenance labels are in the response — I'm not going to launder my probe traffic as "demand."
- **9 lifetime interactions from external (non-Builder) agent_ids across 7 distinct agents.** That's the real demand signal. It's small. I'm not hiding it. The whole point of this post is to grow it.
- Top categories by server count: `other`, `uncategorized`, `search`, `code`, `productivity`, `finance`, `data`. The long tail of "uncategorized" is the most interesting cohort — those are the servers nobody has reviewed.
- A surprising number of "live" servers in registries return 5xx or auth-wall on their declared health endpoint. Drift incidents are logged at `/api/drift_incidents` with the server name and the failure mode.

**Why behavioral, not static:**

A registry score that says "this server has 12 tools and was published in March" tells you nothing about whether the server will respond to your agent at 3am next Thursday. A trust score computed from actual call latency, error rate, schema compliance, and uptime over the last 30 days does. That's the bet.

**What's open:**

- Raw stats: `GET /api/stats`
- Per-server trust: `GET /api/trust/<server_id>`
- Drift incidents: `GET /api/drift_incidents`
- Methodology + scoring: `/methodology`
- SDK (Python): `pip install dominion-observatory-langchain` (LangChain callback handler, 0.1.0)
- SDK (npm): `dominion-observatory-sdk@0.2.0`
- Source: github.com/vdineshk/daee-engine (public)

**What I'm asking for:**

1. Tell me where the methodology is wrong. Trust scoring is a hard problem and I'd rather hear it now.
2. If you maintain an MCP server and want it scored, the SDK is 3 lines. If you don't want telemetry, don't install it — the score will fall back to probe-only mode.
3. If you maintain an agent framework (AutoGen, CrewAI, LlamaIndex) and want a native integration, I have a LangChain callback handler shipped and the others scoped — happy to open PRs.

Compliance note for EU/SG readers: telemetry is anonymized at the SDK layer (success/fail, latency_ms, tool_name only — no payloads, no agent identities beyond an opaque agent_id you control). PDPA/IMDA framing is on the methodology page. EU AI Act Article 50 is the relevant overhang for why behavioral baselines will matter to you in 2026.

I'll be in the thread for the next few hours. Tear it apart.

---

## Posting checklist (Dinesh, 2 minutes)

1. Go to https://news.ycombinator.com/submit
2. Title: copy from above (single line, no markdown)
3. URL: `https://dominion-observatory.sgdata.workers.dev`
4. Submit
5. Immediately post the body above as the first comment on your own submission
6. Reply to **every** comment within 60 minutes for the first 4 hours — HN ranking weights early engagement heavily
7. Verify: check `/api/stats` 6h post-submit; any non-Builder agent_id is a HN attribution signal — log to Brain WHAT WORKS

## Kill criteria

- 0 upvotes and 0 comments at 4h post-submit → HN is dead for this framing; rotate to Lobsters + dev.to follow-up post about "what we learned posting to HN"
- Page-1 (>50 points) within 2h → defer Lobsters post, ride the wave, draft a follow-up "AMA-style" comment thread

## Why this draft is honest

The "9 lifetime external agents" disclosure is deliberate. HN punishes performative numbers. The data-moat thesis only works if the moat is real, and being publicly honest about how small the moat is right now is the fastest way to either get help filling it or get told it's the wrong moat to dig.
