"""
Minimal example: auto-instrument a LangChain tool that hits an MCP server.

Run with:
    pip install dominion-observatory-langchain[langchain] langchain
    python auto_instrument.py

Replace `agent_id` with something stable that identifies YOUR app.
"""

import json
import urllib.request

from langchain_core.tools import Tool

from dominion_observatory_langchain import (
    ObservatoryCallbackHandler,
    SERVER_URL_METADATA_KEY,
)

MCP_URL = "https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp"


def call_get_levy_rates(_: str = "") -> str:
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": "get_levy_rates", "arguments": {}},
    }
    req = urllib.request.Request(
        MCP_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        return resp.read().decode("utf-8")


levy_tool = Tool(
    name="get_levy_rates",
    description="Look up Singapore foreign worker levy rates.",
    func=call_get_levy_rates,
    metadata={SERVER_URL_METADATA_KEY: MCP_URL},
)

handler = ObservatoryCallbackHandler(agent_id="dominion-example-auto-instrument/0.1.0")

# Run the tool directly — the handler still fires via LangChain's dispatch.
result = levy_tool.invoke({"tool_input": ""}, config={"callbacks": [handler]})
print(result[:400])
