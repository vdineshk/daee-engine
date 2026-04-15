# LinkedIn — short version

I published the first EU AI Act Article 12–shaped export for Model Context Protocol (MCP) servers today.

95.4% of the data in it is synthetic. I labeled it that way, row by row, and published it anyway.

Here's why:

Every public MCP trust index I've looked at — Glama, Smithery, MCP Scorecard, Nerq, Zarq — scores servers using GitHub stars, registry metadata, and README quality. None of them collect what an agent actually experiences at call time. None of them ship a compliance-shaped export. None of them separate synthetic from organic traffic at the row level.

I have a working export in the shape EU AI Act Article 12 and Singapore's IMDA Agentic AI Governance Framework ask for. Today it's mostly empty of real production traffic, because I'm building it ahead of the August 2026 deadline, not after. The honest move is to ship it empty and labeled, not to dress up internal traffic as runtime telemetry.

Credibility in regulated markets is one-shot. I'd rather publish a near-empty honest export than a full dishonest one.

The SDK to put a real row in it is three lines of Python, MIT-licensed, and on PyPI today:

pip install dominion-observatory-sdk

Blog post with the full provenance split and the design choices:
https://github.com/vdineshk/daee-engine/blob/main/docs/content/2026-04-15-first-eu-ai-act-mcp-export.md

Built in Singapore. Zero VC. Runs on the Cloudflare free tier.

#AIGovernance #EUAIAct #IMDA #MCP #AgenticAI
