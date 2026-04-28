# EBTO–AGT-α Coexistence Decision — 2026-04-28

**Status:** RESOLVED  
**Author:** DAEE-BUILDER v4.5, post-RUN-022 correction  
**Triggered by:** CEO question (2026-04-28) surfacing regression + architectural ambiguity  

---

## Q1 — Was the EBTO endpoint live after RUN-022?

**No — it 404'd. Confirmed regression.**

### Root cause

Two separate Claude sessions deployed to the same Cloudflare Worker from different feature branches:

| Session | Date | Branch | CF Version | Path |
|---|---|---|---|---|
| Previous session (PR #13) | 2026-04-27 | `claude/brave-sagan-LMrHB` | `77140636` | `/agent-query/{server}` |
| RUN-022 (this session) | 2026-04-28 | `claude/amazing-cannon-iq0w2` | `25498752` | `/api/agent-query/{slug}` |

PR #13 was never merged to `main`. When RUN-022 deployed from `main`'s `index.js` (which had no EBTO code), it overwrote CF version `77140636` → EBTO became 404.

**Fix applied this correction run:**  
EBTO route restored from PR #13's diff. Observatory redeployed as v1.3.0 (CF version `698d9ca1`). Both endpoints verified live post-deploy:

```
GET /agent-query/sg-cpf-calculator-mcp     → HTTP 402, primitive: Empirical-Behavioral-Trust-Oracle-v1 ✅
GET /api/agent-query/sg-cpf-calculator-mcp → HTTP 402, primitive: AGT-ALPHA-V1 ✅
```

### Structural fix for future runs

**PUSH-FIRST DURABILITY PROTOCOL (v4.5) must extend to feature-branch deploys.** The protocol currently requires pushing to `origin/main` before Notion writes. It does NOT prevent a future session from deploying from a branch that's behind main. The specific rule addition:

> **Before deploying any Cloudflare Worker, check `git log origin/main` vs the current working branch's `index.js` to ensure no previously-deployed routes are missing. If divergent, merge `origin/main` or cherry-pick the missing routes before deploying.**

This rule is appended to GENOME ADAPTATIONS this run.

---

## Q2 — Is the dual-path architecture intentional?

**Answer: Option 2a (corrected) — both rails coexist and serve different purposes. The path split was unintentional but the architecture is now intentionally preserved.**

### Two rails, two purposes

| | EBTO | HMAC Internal |
|---|---|---|
| **Path** | `/agent-query/{server-name}` | `/api/agent-query/{server-slug}` |
| **Payment header** | `X-PAYMENT` (x402/Base USDC) | `X-Payment-Proof` (HMAC-SHA256) |
| **Payment settlement** | Base mainnet, USDC, $0.001/call | Internal HMAC proof, no on-chain settlement |
| **Who uses it** | External agents (the revenue rail) | flywheel-keeper self-test only |
| **Config required** | `PAYMENT_WALLET` env var (Dinesh sets) | `INTERNAL_AGENT_SECRET` env var (Dinesh sets) |
| **Revenue potential** | $0.001 × external agent calls | $0 (internal only) |
| **Primitive** | Empirical-Behavioral-Trust-Oracle-v1 | Not a separate primitive — internal test mechanism |
| **Claimed by** | PR #13, 2026-04-27 | RUN-022, 2026-04-28 |

### Design intent going forward

- **EBTO `/agent-query/`** = the empire's external revenue rail. This is what the NOVELTY LEDGER cares about. When Dinesh sets `PAYMENT_WALLET`, real USDC flows on every agent call.
- **`/api/agent-query/`** = internal testing tool. Lets flywheel-keeper validate the trust-verdict machinery without requiring an active x402 payment session. Will be **deprecated** once EBTO's flywheel-keeper probe (`probeEBTO()` from PR #13) completes P-021B-rev.
- **`/api/payment-info`** now advertises both rails so any agent discovering the Observatory knows which path is the external revenue path.

### What this means for P-021B-rev

P-021B-rev requires: "x402-aware Worker route live + flywheel-keeper end-to-end self-test passing."

- EBTO route: ✅ live (restored this run)
- flywheel-keeper self-test: `probeEBTO()` exists in PR #13's flywheel-keeper code but is NOT yet in the deployed flywheel-keeper (PR #13 not merged). **RUN-023 must merge or re-implement `probeEBTO()` in flywheel-keeper.**
- PAYMENT_WALLET: ⚠️ not set → 402 returns empty `accepts[]` (soft-launch mode, no revenue). Dinesh action required.

---

## Q3 (additional flag) — Microsoft AGT namespace collision

**Confirmed risk. "AGT-α" as a primitive name should be retired.**

### What Microsoft AGT is

Microsoft's Agent Governance Toolkit (released 2026-04-02) uses "AGT" as its primary brand identifier. If agents or researchers search for "AGT" they find Microsoft's product first. The empire's claim of "AGT-α" as a primitive name directly collides with Microsoft's established "AGT" brand.

### Why this matters under Constraint 4

Constraint 4 requires: "the empire claims primitives nobody else has shipped." A naming collision with Microsoft's AGT:
1. Does not invalidate the MECHANISM (which is original — no prior art for x402-gated MCP trust verdict)
2. DOES weaken the namespace moat — another player already owns "AGT" mindshare
3. Creates confusion in the NOVELTY LEDGER between the empire's primitive and Microsoft's product

### Resolution

**Retire "AGT-α/β/γ" naming. Adopt "EBTO" family naming.**

| Old name | New name | Rationale |
|---|---|---|
| AGT-ALPHA-V1 | EBTO-v1 | EBTO already claimed 2026-04-27, describes the mechanism better |
| AGT-β (trust-aware MCP router) | TORQ-v1 (Trust-Oracle Routing for agentic Queries) | Original name, no prior art (to verify in RUN-023) |
| AGT-γ (subscription attestation feed) | TASE-v1 (Trust Attestation Streaming for Ecosystem) | Original name, to verify in RUN-023 |

### NOVELTY LEDGER correction

The RUN-022 NOVELTY LEDGER entry `AGT-ALPHA-V1` is retroactively renamed to `EBTO-v1`. The MECHANISM claim stands unchanged. Only the name changes. The Notion Brain entry will be updated this run.

---

## Summary of changes made this correction run

1. **Restored** EBTO `/agent-query/` route handler to Observatory `index.js`
2. **Added** `PAYMENT_WALLET` env var to `wrangler.toml`
3. **Updated** `/api/payment-info` to advertise both rails with clear role separation
4. **Bumped** Observatory version `1.0.0 → 1.3.0` (matching PR #13's established version)
5. **Deployed** CF version `698d9ca1` — both EBTO and HMAC-internal routes verified live
6. **Documented** coexistence design intent (this file)
7. **Updated** DINESH-READ-ME §5 to clearly separate the two env vars
8. **Updated** NOVELTY LEDGER: AGT-ALPHA-V1 → EBTO-v1

---

## Actions still required from Dinesh

### Action A — Set PAYMENT_WALLET (~2 min, highest revenue priority)

```
1. Go to: https://dash.cloudflare.com > Workers > dominion-observatory > Settings > Variables
2. Add variable: PAYMENT_WALLET = <your USDC wallet address on Base mainnet>
   (e.g. 0xCF8C01f1EFc61fA0eCc7614Ed1fA8f668D9aA8A2 if using the Coinbase Wallet from PR #13)
3. Click Save and Deploy
Done. Verify: curl https://dominion-observatory.sgdata.workers.dev/agent-query/sg-regulatory-data-mcp
     Look for: wallet_status: "configured" in the 402 response
```

### Action B — Set INTERNAL_AGENT_SECRET (~2 min, lower priority)

```
1. Open terminal, cd to daee-engine/dominion-observatory
2. wrangler secret put INTERNAL_AGENT_SECRET
3. Paste a 32+ char random string (openssl rand -hex 32)
Done. Enables flywheel-keeper HMAC self-test.
```

**Action A is higher priority** — it activates real revenue collection on external agent calls.  
**Action B is lower priority** — it enables internal testing only; EBTO's flywheel-keeper probe doesn't need it.

---

*— DAEE-BUILDER v4.5, post-RUN-022 correction, branch `claude/amazing-cannon-iq0w2`*
