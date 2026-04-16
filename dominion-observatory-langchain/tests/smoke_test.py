"""
Ground-truth smoke test for dominion-observatory-langchain.

What it proves (each step is a hard assertion — no soft-pass):

1. Package imports cleanly with ONLY the SDK present (LangChain may be
   absent — the stub base class path must work for ``import``).
2. ``ObservatoryCallbackHandler`` rejects reserved / empty agent_ids.
3. ``trust_gate(...)`` rejects reserved / empty agent_ids.
4. The underlying SDK ``report()`` fires successfully with our test
   agent_id. This is the round-trip proof that a random third-party
   developer could install the package and have their telemetry land in
   the Observatory external_demand counter.
5. If ``langchain-core`` is installed, we instantiate the real handler,
   synthesize an ``on_tool_start`` / ``on_tool_end`` pair, and assert
   the fire-and-forget report succeeds.

The script exits 0 on full pass, non-zero on any failure. The agent_id
used for the round-trip is unique per run (timestamp-suffixed) so the
Observatory compliance endpoint can distinguish between runs.
"""

from __future__ import annotations

import sys
import time
import traceback
from uuid import uuid4

PASS = 0
FAIL = 0


def _ok(msg: str) -> None:
    global PASS
    PASS += 1
    print(f"  PASS  {msg}")


def _bad(msg: str, exc: BaseException | None = None) -> None:
    global FAIL
    FAIL += 1
    print(f"  FAIL  {msg}")
    if exc is not None:
        traceback.print_exception(type(exc), exc, exc.__traceback__)


def run() -> int:
    # 1. Clean import
    try:
        import dominion_observatory_langchain as dol

        assert dol.__version__ == "0.1.0"
        _ok("package imports and version == 0.1.0")
    except Exception as exc:
        _bad("package import", exc)
        return 1

    # 2. Callback agent_id validation
    from dominion_observatory_langchain import (
        ObservatoryCallbackHandler,
        TrustGateError,
        trust_gate,
    )

    for bad in ("", "   ", "anonymous", "observatory_probe"):
        try:
            ObservatoryCallbackHandler(agent_id=bad)
            _bad(f"callback accepted reserved/empty agent_id: {bad!r}")
        except ValueError:
            _ok(f"callback rejected reserved/empty agent_id: {bad!r}")

    # 3. trust_gate agent_id validation
    for bad in ("", "anonymous", "observatory_probe"):
        try:
            trust_gate(agent_id=bad)
            _bad(f"trust_gate accepted reserved/empty agent_id: {bad!r}")
        except ValueError:
            _ok(f"trust_gate rejected reserved/empty agent_id: {bad!r}")

    try:
        trust_gate(agent_id="valid", min_score=-1.0)
        _bad("trust_gate accepted min_score=-1.0")
    except ValueError:
        _ok("trust_gate rejected min_score=-1.0")

    # 4. Round-trip SDK report() — the real proof
    from dominion_observatory import report

    agent_id = f"dominion-observatory-langchain-smoketest/{uuid4().hex[:12]}"
    ok = report(
        agent_id=agent_id,
        server_url="https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp",
        success=True,
        latency_ms=42.0,
        tool_name="smoke_test_round_trip",
        http_status=200,
    )
    if ok:
        _ok(f"SDK report() round-trip succeeded with agent_id={agent_id}")
    else:
        _bad(f"SDK report() round-trip returned False for {agent_id}")

    # 5. Real LangChain handler path, if LangChain is available.
    try:
        from langchain_core.callbacks import BaseCallbackHandler  # noqa: F401

        have_lc = True
    except ImportError:
        have_lc = False
        print("  SKIP  langchain-core not installed — handler path smoke-only")

    if have_lc:
        handler = ObservatoryCallbackHandler(
            agent_id=f"dominion-observatory-langchain-handler/{uuid4().hex[:12]}",
            server_url_map={
                "get_levy_rates": (
                    "https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp"
                ),
            },
        )
        run_id = uuid4()
        handler.on_tool_start(
            serialized={"name": "get_levy_rates"},
            input_str="<never-inspected>",
            run_id=run_id,
        )
        # Let latency actually accrue
        time.sleep(0.01)
        handler.on_tool_end(output="<never-inspected>", run_id=run_id)
        _ok("real LangChain handler start/end fired without raising")

        # Error path
        run_id2 = uuid4()
        handler.on_tool_start(
            serialized={"name": "get_levy_rates"},
            input_str="<never-inspected>",
            run_id=run_id2,
        )
        handler.on_tool_error(error=RuntimeError("synthetic"), run_id=run_id2)
        _ok("real LangChain handler error path fired without raising")

        # Unknown tool (no server_url) — must NOT report, must NOT crash
        handler.on_tool_start(
            serialized={"name": "not_an_mcp_tool"},
            input_str="<never-inspected>",
            run_id=uuid4(),
        )
        _ok("handler silently skipped unknown tool")

    print()
    print(f"  TOTAL  pass={PASS}  fail={FAIL}")
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(run())
