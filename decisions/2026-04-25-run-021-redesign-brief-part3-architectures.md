# Redesign Brief Part 3 — Three Alternative Architectures
**RUN-021 — 2026-04-25 (D19)**

> Three honest options. Each with stated buyer, motion, asset leveraged, tradeoffs, and a kill-criterion shape. Recommendation in Part 4.

---

## Option A — Direct Outbound to MCP-Server Vendors ("Benchmark-as-Service")

### Buyer
MCP-server authors and small toolmakers who have shipped their own server and want to (a) prove quality, (b) benchmark against the field, (c) get a free public attestation page they can link from their README/listing.

This buyer **exists today**. Smithery has 10K+ listed servers; the long tail of authors who would value an external-quality signal is real. The buyer's pain is "no one knows how my server actually performs under load."

### Motion
1. Stand up `dominion-observatory.sgdata.workers.dev/benchmark/{server-name}` — a public per-server quality page generated from existing Observatory probe data. Cold-start p50/p99, tool-availability %, response-variance, last-30-day uptime.
2. Direct outbound (Builder drafts, Dinesh sends from his account): for each of the top-50 most-listed MCP servers on Smithery + mcp.so, send the maintainer a single-paragraph LinkedIn/Twitter/email:
   > "I've been benchmarking 4,584 MCP servers for 30 days. Here's your server's behavioral baseline: {URL}. Free, public, updated daily. If you'd like deeper attestation (Article 50-shaped), I have a S$X/mo tier."
3. Free tier = the public page. Paid tier = signed attestations + private dashboards + alert webhooks.

### Asset leveraged
The 25,641 rows of behavioral telemetry × 4,584 servers. Already exists; just needs a per-server view.

### Tradeoffs
- **Strengths.** Buyer exists. Asset exists. The motion is direct (no flywheel needed). It generates **embedded distribution**: every benchmark page links back to the Observatory, so server authors essentially distribute us for free when they cite their public benchmark.
- **Weaknesses.** Requires Dinesh to send messages. Even at 5/week, that's 30 min/week of his time — within budget, but human-gated. Reply rates for cold outreach are typically 5–15%; will need 3–5 weeks to surface signal.
- **Risk.** Outreach can come across as spam; need to be useful in the first sentence (the public benchmark URL is the wedge). Also: some maintainers may view third-party benchmarking as adversarial; need to handle that gracefully.

### Kill-criterion shape
4 weeks (28 days), 25 outreach messages → if 0 replies AND 0 paid pilots and 0 vendors who self-link to their public benchmark page → kill, escalate to Dinesh.

### Engineering required this run
- New endpoint `/benchmark/{server-name}` on Observatory worker — generates per-server stats from existing D1 rows.
- One sample benchmark page rendered for a known popular server (e.g., `filesystem`, `fetch`, `puppeteer`) as proof-of-concept.
- Outreach template (markdown file) that Dinesh can copy-paste 25 times with 1-line customization.

---

## Option B — Embedded Telemetry Inside Popular MCP Servers (dependency play)

### Buyer
Maintainers of the top-20 most-installed open-source MCP servers (filesystem, fetch, sqlite, puppeteer, etc.).

### Motion
1. PR a 1-line integration into each: `import { ObservatoryTelemetry } from 'dominion-observatory-sdk'; ObservatoryTelemetry.attach(server);`
2. The SDK fires anonymized telemetry to the Observatory on every tool call. Maintainer gets: free behavioral dashboard, free public attestation badge for their README, free Article-50-shaped audit log.
3. We get: real external traffic flowing through their servers into our Observatory. Demand signal becomes nonzero. The dataset compounds.

### Asset leveraged
The SDK (already on PyPI + npm + CDN). The Observatory ingestion endpoint.

### Tradeoffs
- **Strengths.** If even 2-3 popular MCP servers merge the integration, we instantly have a demand signal. The "embedded" position becomes a distribution channel for the SDK and a data-flow channel for the Observatory simultaneously. Plays to the asset we already have.
- **Weaknesses.** Highly merge-gated. We already attempted 9 PRs at LangChain ecosystem; 4 partial slot-fills, 0 merges. Expecting a merge from a top-20 MCP server maintainer requires an exceptionally clean PR with obvious value to *them*, and even then merge timelines run 2–8 weeks for popular OSS.
- **Risk.** "Send telemetry to a third party" is a sensitive ask. Maintainers may decline categorically on principle. Need crystal-clear opt-in semantics and zero-PII guarantees. Also: the privacy framing has to be perfect on first read or the PR gets closed without discussion.

### Kill-criterion shape
6 weeks (42 days), 5 PRs to popular MCP servers (not LangChain — we already learned that channel). If 0 merges AND 0 substantive maintainer engagement → kill.

### Engineering required this run
- Audit the SDK for "drop-in" cleanliness. Currently 0.2.0 has a LangChain callback handler; needs an MCP-server-direct attach helper. 1–2 days of work.
- A short policy document: "Why this is safe for your users." Attach to every PR.

---

## Option C — Sell the Dataset to Compliance / Audit / Registry Buyers ("Data-as-Asset")

### Buyer
Three concrete buyer profiles, each known to exist:
1. **Compliance vendors** (DataGuidance, OneTrust, Drata, etc.) building agentic-AI compliance products that need *empirical behavioral baselines* for the MCP-server class.
2. **Auditors** at Big-4 consultancies advising clients on EU AI Act Article 50 + IMDA agentic governance, who need defensible third-party data to cite.
3. **MCP registries themselves** (Smithery, mcp.so) that could license a "trust-feed" overlay to badge their listings.

### Motion
1. Publish a single landing page: `dominion-observatory.sgdata.workers.dev/dataset` — describes the dataset (4,584 servers × 30 days × N-dimensional behavioral baselines), shows a 5-row sample, lists the API endpoints, states pricing tiers (free academic / S$200/mo standard / S$2K/mo enterprise with signed attestations).
2. Builder drafts 3 outbound emails (Dinesh sends): one to a named compliance vendor, one to an audit-firm partner contact, one to a registry maintainer. All offering a 30-day free trial of the standard tier.
3. Builder drafts a `/sample-report.pdf` (or .md) — a concrete 1-week behavioral-quality report on 5 named popular MCP servers. This is the wedge artifact.

### Asset leveraged
The dataset. Most directly. No reinterpretation needed.

### Tradeoffs
- **Strengths.** Cleanest match between asset and buyer. The narrative is honest ("we have data; here is data"). The buyer is unambiguous and contactable. Pricing is in S$ tiers — directly maps to the S$10K/mo goal (5 enterprise pilots = S$10K). The motion is highest-conviction because it requires no flywheel and no ecosystem timing.
- **Weaknesses.** Requires the Builder to produce a credible sample report (30K+ rows is real, but is it sliceable into a buyer-grade artifact?). Requires Dinesh to send 3 cold emails — same human-gating issue but lower volume than Option A.
- **Risk.** The dataset's external-row count is still 9; the bulk is internally generated (flywheel-keeper + probes). A sophisticated buyer will see this in any audit. The pitch must be honest: "this is probe-derived behavioral telemetry; here's exactly how the rows are generated; we're not claiming external-agent volume yet." Honesty of provenance is the differentiator vs. competitors who'd fudge it.

### Kill-criterion shape
4 weeks (28 days), 3 outbound emails sent + 1 sample report published. If 0 replies AND 0 paid pilots → kill, escalate to Dinesh for full strategic reset.

### Engineering required this run
- New `/dataset` landing page (Cloudflare Pages or Worker route) — straightforward.
- Sample report (`benchmarks/sample-report-2026-04.md`) — 1-week stats on 5 named MCP servers with raw queries shown for reproducibility.
- Outreach template (markdown) for 3 named contact archetypes.

---

## Cross-cutting comparison

| Dimension | Option A (Vendors) | Option B (Embed) | Option C (Dataset) |
|---|---|---|---|
| Buyer exists today? | Yes (50+ vendors reachable) | Yes (~20 maintainers) | Yes (3 archetypes) |
| Asset leverage | Per-server view of dataset | SDK + ingestion path | Dataset itself |
| Human-gated critical path | Medium (5 msgs/wk) | Low (PRs once drafted) | Low (3 emails, 1 push) |
| Time to first signal | 3–5 weeks | 2–8 weeks | 2–4 weeks |
| Time to first revenue | 6–10 weeks | 8–14 weeks | 4–8 weeks |
| Conviction on signal type | Medium (replies) | Low (merges are rare) | Medium-High (paid pilot or no) |
| Direct path to S$10K/mo | Indirect (via paid tiers) | Indirect (via signal → product) | **Direct** (5 × S$2K = S$10K) |
| Kills the existing flywheel? | No, complements | No, complements | No, complements |
| Engineering this run | Per-server endpoint + sample | SDK attach helper + policy doc | Landing page + sample report |

All three options:
- Preserve the existing infrastructure (Observatory, SDK, servers stay running)
- Stop the false-flywheel investment (no more content pieces, no more registry-prep)
- Sell to humans who exist instead of agents who don't yet
- Have an explicit kill-criterion at 4–6 weeks

Recommendation in Part 4.
