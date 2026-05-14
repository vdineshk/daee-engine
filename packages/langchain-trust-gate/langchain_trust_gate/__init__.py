"""LangChain Trust Gate — behavioral trust scoring for agent interactions.

Provides a LangChain Tool that queries Dominion Observatory for behavioral
trust scores before agents execute sensitive operations.

Usage:
    from langchain_trust_gate import TrustGateTool, check_trust

    # As a LangChain tool (for agents)
    tool = TrustGateTool()
    result = tool.invoke({"agent_id": "my-mcp-server"})

    # Direct function call
    evaluation = await check_trust("my-mcp-server")
    if evaluation["decision"] == "PASS":
        # proceed
"""

from langchain_trust_gate.tool import TrustGateTool, check_trust, TrustEvaluation

__all__ = ["TrustGateTool", "check_trust", "TrustEvaluation"]
__version__ = "0.1.0"
