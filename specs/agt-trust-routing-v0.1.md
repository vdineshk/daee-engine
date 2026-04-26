# AGT — Agent-paid Trust-routed x402 Endpoints (v0.1 spec)

**Status:** DRAFT — empire's first claim of the *trust-conditioned x402 fee* primitive.
**Authors:** DAEE-BUILDER (RUN-022, D20, 2026-04-26).
**Supersedes:** the AGT-α/β/γ shapes sketched in `decisions/2026-04-25-run-021-CEO-OVERRIDE.md`.
**Pre-commitment:** P-021B-rev (D26, 2026-05-02) — this spec + a Worker stub + an end-to-end self-test.

---

## 0. Why this exists

The Observatory has been free-to-call since launch. RUN-021's CEO override redirected the empire from a B2B/dataset-sales pivot back onto the agent-economy axis, and named three monetization shapes (AGT-α/β/γ) for ratification. RUN-022's NOVELTY-HUNT screened the x402 + MCP + trust space for prior art (see `decisions/2026-04-26-run-022-novelty-hunt.md`). The space is heavily contested at the *flat-fee paid-tool* layer (Vercel `paidTool`, AnChain.AI sanctions screening, MCPay, AIsa, etc.). The space is **empty** at the *runtime-behavior-modulated fee* layer. AGT claims that primitive.

The mechanism: **the price an agent pays is a function of where the empire is routing it.** Calls that resolve to high-trust servers cost less than calls that resolve to low-trust servers, with the trust score sourced from the Observatory's accumulated runtime telemetry. The empire is the only entity that can issue this primitive because the empire is the only entity holding 30+ days of comparable behavioral telemetry across 4,584 servers.

This satisfies Constitution v1 as follows:

- **Constraint 1 (Agent Economy Only):** every endpoint is agent-callable; payment is x402; no human in the loop.
- **Constraint 2 (No Human Sales):** buyer = software calling HTTP. No sales motion.
- **Constraint 3 (S\$10K/month by 2027-03-25):** per-call micro-revenue × volume, with the call layer fully wired the moment agent traffic arrives.
- **Constraint 4 (Originality):** no prior art for *trust-modulated* x402 pricing. Curated x402 lists, paid-tool primitives, and trust-attestation payloads all exist; their composition into a single fee-modulating primitive does not.

---

## 1. Vocabulary the empire claims

These names are the empire's. Public posts referencing this primitive must use them.

- **Trust-routed call** — an HTTP request to the Observatory where the response payload is a routing decision plus optional pass-through to a target MCP server, and where the x402 fee for that response is a function of the destination's trust score.
- **Behavioral fee tier** — the discrete price band derived from a destination server's Observatory trust score. v0.1 defines 4 tiers (`T0`/`T1`/`T2`/`T3`).
- **Routable receipt** — the x402 settlement receipt, augmented with the trust score that justified the fee. Signed by the Observatory. Reusable for off-chain audit (compliance buyers can verify a routing was bought at the price implied by the score).
- **Subscription-attestation feed** — a streaming endpoint that pushes signed score-crossing events to subscribed agents, x402-priced by sub interval.

---

## 2. The three endpoints

### AGT-α — `GET /agent-query/{server-id}` (per-call trust-routed lookup)

Single-shot. Caller asks "should I call `{server-id}` right now and at what price?" Observatory replies with the current trust score, a behavioral fee tier, and an x402 challenge for that tier.

**Request:**
```
GET /agent-query/sg-cpf-calculator-mcp HTTP/1.1
Host: dominion-observatory.sgdata.workers.dev
X-Agent-Id: agent-claude-sonnet-4-6-anonymized-bucket-001
```

**Response when unpaid (HTTP 402):**
```
HTTP/1.1 402 Payment Required
X-AGT-Behavioral-Tier: T2
X-AGT-Trust-Score: 0.71
X-AGT-Server-Id: sg-cpf-calculator-mcp
WWW-Authenticate: x402 max=0.0010 USDC, network=base, recipient=0xEMPIRE..., facilitator=cdp.coinbase.com, resource=/agent-query/sg-cpf-calculator-mcp
Content-Type: application/json

{
  "tier": "T2",
  "score": 0.71,
  "price_usdc": "0.0010",
  "explanation": "T2 = trust score 0.65–0.79; price 0.0010 USDC."
}
```

**Response when paid (HTTP 200, with routable receipt):**
```
HTTP/1.1 200 OK
Content-Type: application/json
X-AGT-Receipt-Id: rcpt_b8f4...

{
  "server_id": "sg-cpf-calculator-mcp",
  "trust_score": 0.71,
  "tier": "T2",
  "issued_at": "2026-04-26T05:00:00Z",
  "valid_until": "2026-04-26T05:05:00Z",
  "endpoint": "https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp",
  "receipt": {
    "id": "rcpt_b8f4...",
    "settlement_tx": "0x...",
    "score_at_purchase": 0.71,
    "tier_at_purchase": "T2",
    "signature": "ed25519:..."
  }
}
```

The receipt is **routable** because the agent can present it to downstream auditors as proof that the pricing matched the behavioral tier at issuance time.

### AGT-β — `POST /trust-router` (per-batch trust-aware routing)

Caller sends a list of N candidate servers; Observatory returns the top-K ranked by trust score and bills as a single x402 transaction whose price is the **weighted average** of the K destinations' tiers. This is the primitive that has no prior art: routing fees that are a function of the runtime score of where the router resolves you.

**Request:**
```
POST /trust-router HTTP/1.1
Content-Type: application/json

{
  "candidates": ["mcp-a", "mcp-b", "mcp-c", "mcp-d"],
  "k": 2,
  "agent_id": "agent-...",
  "intent": "search"
}
```

**Response (HTTP 402 first call, 200 after settlement):**
```json
{
  "ranked": [
    {"server_id": "mcp-c", "score": 0.88, "tier": "T3"},
    {"server_id": "mcp-a", "score": 0.74, "tier": "T2"}
  ],
  "tier_weighted": "T2.5",
  "price_usdc": "0.0015"
}
```

The pricing curve (v0.1 — subject to ratification):

| Tier | Trust score band | Per-call price (USDC) | Rationale |
|---|---|---|---|
| T3 | ≥ 0.80 | 0.0005 | Premium routes; empire wants agents to prefer them. Low fee is the carrot. |
| T2 | 0.65 – 0.79 | 0.0010 | Default routing tier. |
| T1 | 0.50 – 0.64 | 0.0030 | Caller is paying a risk premium. |
| T0 | < 0.50 | 0.0080 | Caller is paying for a route the empire actively discourages. Optional `X-AGT-Refuse: 1` instructs Observatory to refuse routing entirely below 0.50 (default off). |

The fee curve is **inverse-monotone in trust**: the worse the destination, the higher the price. This is the originality. Existing x402 deployments price by destination cost, by seller-set rate, or by API method. Nobody has shipped destination-trust-modulated pricing because nobody else has the runtime telemetry.

### AGT-γ — `GET /attest-feed` (subscription-attestation feed)

Server-Sent Events stream. Subscribed agents receive signed events when any tracked server crosses a trust-tier boundary. Priced as an x402 subscription with N-minute renewal windows; renewal headers identical to AGT-α's pattern.

**Stream payload example:**
```
event: tier-crossing
data: {"server_id":"mcp-x","prev_tier":"T2","new_tier":"T3","at":"2026-04-26T05:12:00Z","sig":"..."}
```

Agents subscribe to all servers, a single server, or a category. Pricing v0.1: 0.0050 USDC per 5-minute window for all-server feed; 0.0010 for single-server; 0.0020 for category.

---

## 3. Receipt format (`routable_receipt_v0.1`)

JSON-LD-friendly. Signed by the Observatory's ed25519 key (TBD: rotation policy in v0.2).

```json
{
  "@context": "https://dominion-observatory.sgdata.workers.dev/contexts/agt-receipt-v0.1.jsonld",
  "type": "RoutableReceipt",
  "id": "rcpt_b8f4...",
  "issuer": "https://dominion-observatory.sgdata.workers.dev",
  "issued_at": "2026-04-26T05:00:00Z",
  "valid_until": "2026-04-26T05:05:00Z",
  "subject": {
    "agent_id_hash": "sha256:...",
    "destination_server_id": "sg-cpf-calculator-mcp",
    "score_at_purchase": 0.71,
    "tier_at_purchase": "T2"
  },
  "settlement": {
    "protocol": "x402",
    "network": "base",
    "tx_hash": "0x...",
    "amount_usdc": "0.0010"
  },
  "signature": "ed25519:..."
}
```

The receipt is the audit primitive. A compliance buyer (e.g. an EU AI Act Article 12 auditor) reading an agent's logs sees a routable receipt and can cryptographically verify both the routing decision and the price paid for that decision were consistent with the behavioral tier at purchase time. **This is the audit-grade artifact the empire wants compliance buyers to discover via their own search**, not via empire outreach. Constraint 1 + 2 satisfied.

---

## 4. Implementation map (Cloudflare Worker, no new dependencies in v0.1)

The Observatory worker source already lives at `dominion-observatory/src/index.js` (mirrored RUN-010). v0.1 ships:

1. New routes: `GET /agent-query/:id`, `POST /trust-router`, `GET /attest-feed`.
2. New table `agt_receipts(id, agent_id_hash, server_id, score, tier, price_usdc, issued_at, valid_until, signature, settlement_tx)` in the existing D1 binding.
3. **x402 integration:** v0.1 ships **the 402 challenge surface only** (correct headers, well-formed `WWW-Authenticate: x402`). Settlement verification is stubbed and accepts a placeholder `Bearer test-receipt-{tier}` header so the end-to-end self-test can run without a Coinbase facilitator dependency. v0.2 wires the actual `cdp.coinbase.com` facilitator.
4. ed25519 signing key bound as a Worker secret (`AGT_SIGNING_KEY`). Rotation policy v0.2.
5. Public `/.well-known/agt-trust-routing.json` advertising the spec URL, signing public key, supported tiers, and pricing curve. Agents discover the empire's primitive without ever talking to a human.

**No deploy in this run.** The dry-run + real deploy ship in RUN-023 against fresh context. This file is the spec; the Worker code lands next.

---

## 5. End-to-end self-test (P-021B-rev pass condition)

Lives at `tests/agt-self-test.sh` once code lands. Pass condition:

1. `curl /agent-query/sg-cpf-calculator-mcp` → 402 with valid `X-AGT-*` headers and a parseable `WWW-Authenticate: x402` line.
2. `curl -H "Authorization: Bearer test-receipt-T2" /agent-query/sg-cpf-calculator-mcp` → 200 with a routable-receipt body whose `tier_at_purchase` field matches the 402 response's tier.
3. `POST /trust-router` with 4 candidates → 200 with a `tier_weighted` field and a price ∈ {0.0005, 0.0010, 0.0030, 0.0080} or weighted intermediate.
4. `GET /.well-known/agt-trust-routing.json` → 200, JSON parses, `signing_pubkey` matches the receipt signature.
5. `curl /attest-feed` → 402 first, then SSE stream after `Authorization: Bearer test-sub-...`.

Pass = all five green. Fail = log in `decisions/2026-05-02-run-NN-agt-self-test-fail.md` and reroute to AGT-α-only ship in v0.2.

---

## 6. Why this primitive compounds (the empire's bet)

- **Telemetry asymmetry.** Only the empire has 30+ days of comparable runtime data across 4,584 servers. The pricing curve is sourced from data nobody else has. A copier would ship `cp` of the spec on day 1 and produce wrong prices on day 1 because they have no runtime score to anchor to. Day-30 copier still has 30 days less telemetry than the empire. The moat is time, not code.
- **Audit pull.** The routable-receipt format is what compliance buyers grep for in agent logs. As regulators mature their guidance (EU AI Act Article 12, IMDA's agentic AI framework), the receipt becomes the artifact that satisfies the audit, and the empire becomes the canonical issuer because the empire defined the format first.
- **Vocabulary capture.** "Behavioral fee tier" and "trust-routed call" enter the agent economy's vocabulary the moment this spec is referenced in public posts. A second-mover competitor either uses the empire's vocabulary (validates the primitive) or ships under different vocabulary (fragments the audit-buyer search and slows their adoption).
- **Composability.** AGT-β feeds AGT-γ (every routing decision is a candidate tier-crossing event). AGT-α feeds AGT-β (callers run α to learn a destination's tier, then β to actually route). The three endpoints are not independent products; they are a single primitive surface.

---

## 7. Open questions for CEO ratification (default if silent by D22)

| Q | CEO option | Builder default if silent |
|---|---|---|
| Pricing curve numbers | tweak any tier price | hold v0.1 numbers above |
| Refuse-below-0.50 default | on / off | **off** (caller pays the T0 premium) |
| Network for x402 settlement | Base / Solana / Ethereum L2 | **Base** (matches Coinbase facilitator) |
| AGT-α/β/γ ship order | α-only / α+β / all three | **α + β together** (β is the originality; α alone is a copy of paidTool) |
| Spec governance | empire-only / empire-led-RFC | **empire-only v0.1**; convert to public RFC at v0.3 once first inbound payment lands |

CEO action: reply on PR (TBD this run) or in DAEE-Decisions with single-letter answers. Default fires automatically D22 (2026-04-28 Tuesday) per the RUN-021 pre-commitment.
