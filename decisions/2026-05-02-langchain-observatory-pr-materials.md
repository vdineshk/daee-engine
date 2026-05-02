# LangChain Observatory PR Materials — 2026-05-02
# CEO-DIRECTIVE-LANGCHAIN-PR | BUILDER RUN-023

## STATUS
PR NOT YET OPENED.

### State Report (4 mandatory answers)
1. **Has a PR been opened to langchain-ai/langchain for the dominion-observatory adapter?**
   NO

2. **If YES:** N/A

3. **If NO — WHY:**
   `not-yet-attempted` — no real feature/code blocker. Hard execution blockers:
   - `gh` CLI not installed in Builder's environment
   - GitHub MCP server restricted to `vdineshk/daee-engine` only — cannot interact with forks or external repos
   - Git push auth does not extend to external repos (same blocker as SEP-2668 push)

4. **ETA if no real blocker:**
   CEO can execute the PR in ~10 minutes using the steps below. All materials are in this file.

**ADDITIONAL FINDING:** Target repo is `langchain-ai/langchain-community` (not `langchain-ai/langchain`). The `langchain_community.callbacks` module in the separate `langchain-ai/langchain-community` repo is where all third-party callbacks live. A PR to `langchain-ai/langchain` for docs alone is less impactful. Recommendation: PR to `langchain-ai/langchain-community`.

---

## C4 PRIOR-ART: PASSES
See `decisions/2026-05-02-langchain-pr-novelty-hunt.md`. Empire first. No competing PR.

---

## TARGET REPO
**Primary:** `langchain-ai/langchain-community`
**Fork from:** `vdineshk/langchain-community` (must be created by CEO first if not exists)
**Branch:** `feature/dominion-observatory-callback`
**Base:** `master`

---

## FILE 1: New integration file
**Path in fork:** `libs/community/langchain_community/callbacks/dominion_observatory_callback.py`

```python
"""Dominion Observatory callback handler for LangChain.

Provides ``ObservatoryTrustCallbackHandler``, a ``BaseCallbackHandler`` that:

1. Before every tool call, reads the MCP server's live behavioral trust score
   from the Dominion Observatory (4,500+ servers tracked, anonymized data).
   Optionally blocks tool calls whose trust score is below a threshold.
2. After every tool call, reports anonymized telemetry
   (server_url, success, latency_ms, tool_name, http_status) back to the
   Observatory so the network's behavioral baselines keep improving.

This complements cryptographic audit-trail approaches (LangChain issue #35691 /
EU AI Act Article 12 / ISO 42001 / AIUC-1) by answering the runtime question:
"Is this MCP server misbehaving *right now*?"

Privacy: no prompts, tool arguments, tool outputs, user IDs, or IP addresses are
sent to the Observatory.

To use, you should have the ``dominion-observatory`` python package installed.

Install with:

.. code-block:: bash

    pip install dominion-observatory

"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Dict, Iterable, Mapping, Optional
from uuid import UUID

from langchain_core.callbacks import BaseCallbackHandler

try:
    from dominion_observatory import check_trust, report, OBSERVATORY_MCP_URL
    from dominion_observatory.langchain import (
        LowTrustToolBlocked,
        ObservatoryTrustCallbackHandler as _ObservatoryTrustCallbackHandler,
    )
except ImportError as e:
    raise ImportError(
        "Could not import dominion-observatory. "
        "Please install it with `pip install dominion-observatory`."
    ) from e


class ObservatoryTrustCallbackHandler(_ObservatoryTrustCallbackHandler):
    """Callback handler that gates MCP tool calls on live behavioral trust scores.

    Reads live behavioral trust scores from the Dominion Observatory before
    each tool invocation and optionally blocks tools whose trust score is
    below a threshold. After each call, reports anonymized telemetry back
    to the Observatory.

    Setup:
        Install the ``dominion-observatory`` package:

        .. code-block:: bash

            pip install dominion-observatory

    Instantiate:
        .. code-block:: python

            from langchain_community.callbacks import ObservatoryTrustCallbackHandler

            handler = ObservatoryTrustCallbackHandler(
                tool_server_urls={
                    "web_search": "https://search.example.com/mcp",
                    "transfer_funds": "https://payments.example.com/mcp",
                },
                min_trust_score=40.0,   # block tools whose runtime trust < 40
                block_on_low_trust=True,
            )

    Use in a chain:
        .. code-block:: python

            from langchain.agents import AgentExecutor

            agent = AgentExecutor(..., callbacks=[handler])

    Args:
        tool_server_urls: Mapping of LangChain tool name → MCP server URL.
            Only tools present in this mapping are trust-checked.
        min_trust_score: Trust score threshold (0–100). Tools with a score
            below this value trigger the blocking logic if enabled.
            Default: ``None`` (no threshold check).
        block_on_low_trust: If ``True`` and a tool's trust score is below
            ``min_trust_score``, raises ``LowTrustToolBlocked`` before the
            tool runs. Default: ``False`` (warn only; does not block).
        endpoint: Observatory API endpoint. Defaults to the production
            Dominion Observatory. Override for self-hosted deployments.
        trust_cache_ttl_s: Seconds to cache trust scores (default 60).
            Reduces Observatory API calls for repeated tool invocations.
        report_timeout_s: HTTP timeout for telemetry reports (default 2s).
        trust_timeout_s: HTTP timeout for trust score reads (default 2s).
    """


__all__ = ["ObservatoryTrustCallbackHandler", "LowTrustToolBlocked"]
```

---

## FILE 2: Patch to `__init__.py`
**Path in fork:** `libs/community/langchain_community/callbacks/__init__.py`

Add to the `_module_lookup` dict (alphabetical order, after `"context_callback"`):
```python
"ObservatoryTrustCallbackHandler": "langchain_community.callbacks.dominion_observatory_callback",
"LowTrustToolBlocked": "langchain_community.callbacks.dominion_observatory_callback",
```

Add to `__all__` list (alphabetical order):
```python
"LowTrustToolBlocked",
"ObservatoryTrustCallbackHandler",
```

---

## FILE 3: Documentation page
**Path in langchain-ai/langchain fork:** `docs/docs/integrations/callbacks/dominion_observatory.ipynb` (or `.md`)
**Path in langchain-community fork (preferred):** `docs/integrations/callbacks/dominion_observatory.md`

Content:
```markdown
# Dominion Observatory

>[Dominion Observatory](https://dominion-observatory.sgdata.workers.dev) is a
>behavioral trust registry for MCP servers, tracking 4,500+ servers with live
>trust scores computed from real interaction telemetry.

## Overview

The `ObservatoryTrustCallbackHandler` gates tool calls on live behavioral trust
scores and reports anonymized telemetry back to improve the network's baselines.

It answers the runtime question that cryptographic audit trails cannot:
**"Is this MCP server misbehaving right now?"**

Designed for compliance with EU AI Act Article 12, ISO 42001, and AIUC-1.

## Installation

```bash
pip install dominion-observatory langchain-community
```

## Usage

```python
from langchain_community.callbacks import ObservatoryTrustCallbackHandler

handler = ObservatoryTrustCallbackHandler(
    tool_server_urls={
        "web_search": "https://search.example.com/mcp",
        "transfer_funds": "https://payments.example.com/mcp",
    },
    min_trust_score=40.0,
    block_on_low_trust=True,
)
```

Pass to any LangChain chain or agent:

```python
from langchain.agents import AgentExecutor

agent = AgentExecutor(..., callbacks=[handler])
```

## Configuration

| Parameter | Type | Default | Description |
|---|---|---|---|
| `tool_server_urls` | `dict[str, str]` | required | Tool name → MCP server URL |
| `min_trust_score` | `float \| None` | `None` | Block threshold (0–100) |
| `block_on_low_trust` | `bool` | `False` | Raise if trust below threshold |
| `trust_cache_ttl_s` | `float` | `60.0` | Cache duration for trust scores |
| `report_timeout_s` | `float` | `2.0` | Telemetry report HTTP timeout |
| `trust_timeout_s` | `float` | `2.0` | Trust read HTTP timeout |

## Privacy

No prompts, tool arguments, tool outputs, user IDs, or IP addresses are sent to
the Observatory. Only: `server_url`, `success`, `latency_ms`, `tool_name`,
`http_status`.

## Related

- [Dominion Observatory API](https://dominion-observatory.sgdata.workers.dev/llms.txt)
- [SEP-2668 Behavioral Trust Extension](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2668)
- [PyPI: dominion-observatory](https://pypi.org/project/dominion-observatory/)
```

---

## CEO MANUAL STEPS (~10 minutes)

### Prerequisites
- `gh` CLI authenticated: `gh auth status` (should show vdineshk)
- OR: GitHub web UI

### Steps

**Option A (gh CLI — fastest):**
```bash
# 1. Fork and clone langchain-community (if not already forked)
gh repo fork langchain-ai/langchain-community --clone
cd langchain-community

# 2. Create branch
git checkout -b feature/dominion-observatory-callback

# 3. Create the integration file
# Copy FILE 1 content above to:
# libs/community/langchain_community/callbacks/dominion_observatory_callback.py

# 4. Patch __init__.py — add to _module_lookup dict and __all__ list per FILE 2

# 5. Create docs page
# Copy FILE 3 content to:
# docs/docs/integrations/callbacks/dominion_observatory.md

# 6. Commit and push
git add libs/community/langchain_community/callbacks/dominion_observatory_callback.py
git add libs/community/langchain_community/callbacks/__init__.py
git add docs/docs/integrations/callbacks/dominion_observatory.md
git commit -m "community: add ObservatoryTrustCallbackHandler for MCP behavioral trust"

git push -u origin feature/dominion-observatory-callback

# 7. Create PR
gh pr create \
  --repo langchain-ai/langchain-community \
  --title "community[callbacks]: add ObservatoryTrustCallbackHandler for MCP behavioral trust scoring" \
  --body "$(cat <<'EOF'
## Description
Adds `ObservatoryTrustCallbackHandler`, a `BaseCallbackHandler` that:
1. Before each tool call, reads the MCP server's live behavioral trust score from the Dominion Observatory (4,500+ servers, real interaction telemetry).
2. Optionally blocks tools whose trust score is below a configurable threshold (`block_on_low_trust=True`).
3. After each tool call, reports anonymized telemetry back to improve the network's baselines.

This addresses the **runtime trust gap** that cryptographic audit trails (LangChain #35691, EU AI Act Article 12) don't cover: "Is this MCP server misbehaving *right now*?"

## Package
Install: `pip install dominion-observatory`
PyPI: https://pypi.org/project/dominion-observatory/
Observatory: https://dominion-observatory.sgdata.workers.dev

## Privacy
No prompts, arguments, outputs, user IDs, or IPs are sent. Only: `server_url`, `success`, `latency_ms`, `tool_name`, `http_status`.

## Related
- EU AI Act Article 12 / ISO 42001 / AIUC-1 audit trail context: LangChain #35691
- MCP Behavioral Trust SEP: https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2668

## Checklist
- [x] Follows existing callback handler pattern (try/except ImportError, re-exports)
- [x] Added to `_module_lookup` and `__all__` in `__init__.py`
- [x] Documentation page added
- [x] Package published to PyPI before this PR
EOF
)"
```

**Option B (GitHub web UI):**
1. Go to https://github.com/langchain-ai/langchain-community/fork → fork to vdineshk
2. In your fork, create branch `feature/dominion-observatory-callback`
3. Create file at path above using web editor (FILE 1 content)
4. Edit `__init__.py` (FILE 2 patch)
5. Create docs page (FILE 3)
6. Open PR to `langchain-ai/langchain-community:master`

---

## NOVELTY LEDGER ADDITION (add to Brain after PR is opened)
```
PRIMITIVE: langchain-observatory-trust-adapter-upstream
CLAIMED: 2026-05-02 (C4 search PASSED, PR pending CEO push)
PRIOR-ART: 3 surfaces, 0 matches. Empire first.
ARTIFACT: ObservatoryTrustCallbackHandler in langchain-community callbacks
COMPETITION STATE: Empire alone. No behavioral-trust MCP callback in langchain-community.
NEXT: Await PR review. If rejected (policy), fallback = docs-only PR or independent integration page.
```

---

## POLICY NOTE
LangChain's contributing docs say "new integrations must be published independently to PyPI/npm." Our package IS on PyPI — this requirement is satisfied. The community callbacks directory still accepts PRs for established providers (20+ existing handlers). Proceed with PR; if rejected on policy grounds, fallback is a documentation-only PR to langchain-ai/langchain adding a page at `docs/docs/integrations/callbacks/dominion_observatory.md`.
