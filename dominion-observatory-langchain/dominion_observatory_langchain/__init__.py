"""
Dominion Observatory — LangChain / LangGraph integration.

Three things:

1. ObservatoryCallbackHandler(agent_id, ...):
   A LangChain BaseCallbackHandler that auto-reports every tool invocation
   to the Dominion Observatory. Drop it into any chain/agent/LangGraph run
   via ``config={"callbacks": [handler]}``.

2. trust_gate(agent_id, min_score=...):
   Returns a callable pre-flight check that raises ``TrustGateError`` if
   a server's current Observatory trust score is below ``min_score``.
   Use it as a guardrail before your agent ever hits an untrusted MCP.

3. observatory_tools(agent_id):
   Returns a list of LangChain Tool instances (``check_mcp_trust``,
   ``observatory_stats``) so the agent itself can introspect the
   Observatory at runtime.

All three funnel through ``dominion-observatory-sdk>=0.2.0`` so every
report carries a caller-supplied, non-reserved ``agent_id``. Reports
contain only ``{agent_id, server_url, success, latency_ms, tool_name,
http_status}`` — no prompts, user data, or IPs.
"""

from __future__ import annotations

from .callback import ObservatoryCallbackHandler, SERVER_URL_METADATA_KEY
from .trust_gate import TrustGateError, trust_gate
from .tools import observatory_tools

__version__ = "0.1.0"
__all__ = [
    "ObservatoryCallbackHandler",
    "SERVER_URL_METADATA_KEY",
    "TrustGateError",
    "trust_gate",
    "observatory_tools",
    "__version__",
]
