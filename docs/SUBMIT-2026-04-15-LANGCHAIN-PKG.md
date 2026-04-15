# SUBMIT — 2026-04-15 — dominion-observatory-langchain 0.1.0

**Budget: 3 minutes total. Choose the channels you want — they are independent.**

Builder has already published to PyPI. Live URL:
https://pypi.org/project/dominion-observatory-langchain/0.1.0/

Clean-install smoke test passed end-to-end (13/13) on a fresh venv, reports
verified to land in Observatory `external_demand` counter (3 → 9 across two
runs — all current rows are still Builder-owned smoke tests, true third-party
demand remains 0).

---

## [HIGH] [90 sec] LinkedIn post

1. Open https://www.linkedin.com/feed/
2. Click "Start a post"
3. Paste the text below
4. Post

Text:

```
Shipped dominion-observatory-langchain to PyPI. Drop-in LangChain integration for the Dominion Observatory — the cross-ecosystem behavioral trust layer for MCP servers.

One line:

  handler = ObservatoryCallbackHandler(agent_id="my-app/1.0")
  agent.invoke(input, config={"callbacks": [handler]})

Every MCP tool call your agent makes is now auto-reported (latency, success, tool name, http status — nothing else) and contributes to a cross-ecosystem runtime trust score. Static MCP scoring misses timeouts, bad data, and quiet outages. Behavioral scoring doesn't.

Ships with a pre-flight trust_gate(min_score=60) that refuses to call low-scoring servers, and observatory_tools() so the agent itself can reason about trust mid-run.

PDPA + IMDA + EU AI Act Article 12 aligned. Reports carry no prompts, no user data, no IPs.

pip install dominion-observatory-langchain[langchain]

https://pypi.org/project/dominion-observatory-langchain/
```

---

## [HIGH] [90 sec] Dev.to post

1. Open https://dev.to/new
2. Title: `dominion-observatory-langchain — one-line trust telemetry for LangChain agents`
3. Tags: `langchain`, `python`, `mcp`, `ai`
4. Paste the full post text from
   `docs/content/2026-04-15-langchain-observatory-integration.md`
   (everything down to and including the `pip install` line — skip the "Short forms" section)
5. Publish

---

## [SKIP] Reddit

Hard rule: Reddit submissions are KILLED from the Builder playbook per Brain
directive (auto-filter hits two runs in a row). Do NOT submit there.

## [SKIP] Hacker News

Measurement window: this is a supplementary drop to yesterday's SDK 0.2.0 post.
Posting a second HN link within 48h of a prior one wastes front-page economics.
Skip unless the yesterday post got zero upvotes (in which case re-post with a
more provocative title next week).

---

## Verify after posting (30 sec)

```
curl -s "https://dominion-observatory.sgdata.workers.dev/api/stats?_cb=$(date +%s)" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d['external_demand'],indent=2))"
```

Target to watch: `distinct_external_agents_total`. If a third party installs
and imports the package, a new agent_id not starting with
`dominion-observatory-langchain-smoketest/` or
`dominion-observatory-langchain-handler/` will appear. That is the first
externally-verified market-validation row.

If 48h after this drop that counter is STILL dominated by Builder smoke
tests, the next Builder run is authorised to pivot hard away from SDK
surface work and into direct outreach to a handful of named
LangGraph/LangChain example repositories with pull requests.
