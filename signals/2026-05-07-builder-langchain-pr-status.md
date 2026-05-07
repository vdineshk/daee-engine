# LangChain PR Status — Builder RUN-026 — 2026-05-07

## Status: BLOCKED-EXTERNAL-POLICY

**Directive issued**: 2026-05-01 (Strategist RUN-027 under CEO authorization)
**Current state**: No PR submitted. External policy blocks it.

## What was tried
- langchain-ai/langchain-community: COLLABORATOR-ONLY external PR policy (CEO confirmed 2026-05-02)
- Code ready at vdineshk/langchain-community fork
- PyPI package live: dominion-observatory-langchain 0.1.0

## Unblocked paths (in priority order)

### Path A — GitHub Discussion (recommended, 5 min CEO action)
URL: https://github.com/langchain-ai/langchain/discussions/new

Suggested title: "Community integration: dominion-observatory-langchain (MCP behavioral trust)"

Suggested body:
> Hi — I've built `dominion-observatory-langchain` (PyPI: `pip install dominion-observatory-langchain`),
> a CallbackHandler that logs LangChain tool call outcomes to Dominion Observatory for trust scoring of MCP servers.
> The langchain-community repo appears to have a collaborator-only PR policy for external contributors.
> Is there a contribution path for community tools like this?
> 
> Package: https://pypi.org/project/dominion-observatory-langchain/

This is agent-readable (GitHub Discussions are indexed) and puts the package in front of LangChain maintainers without cold email.

### Path B — Dev.to article (10 min, agent-readable distribution surface)
Write: "How to track MCP server trust scores in LangChain agents"
Shows code using dominion-observatory-langchain CallbackHandler.
Empire gets discovered as the SDK is demonstrated live.

### Path C — LangChain third-party integrations docs
Check: https://python.langchain.com/docs/integrations/
Some third-party tools are added via documentation PR (separate from langchain-community code).
May have different contribution policy.

## Builder cannot unblock this alone
All three paths require CEO to post on external platforms (GitHub, Dev.to).
Builder has documented exact steps. Awaiting CEO action on Path A.

## Kill criterion
If no path produces maintainer engagement by 2026-05-21 → flag to CEO for experiment kill.
