# NOVELTY-HUNT — RUN-022 (D20, 2026-04-26)

**Hunted primitive:** trust-routed x402 endpoints with behavior-modulated pricing, settled into a routable receipt, anchored on the Observatory's runtime telemetry.

**Decision:** the *trust-modulated x402 fee curve* is empty of prior art. Empire claims it. Spec at `specs/agt-trust-routing-v0.1.md`.

---

## Constitution Constraint 4 (Originality) gate

"Has anyone done this exact mechanism before?" Search ran across 6 surface categories per the Builder hunt rules (.well-known, schema.org-adjacent, ERC numbers, MCP SEPs, agent-economy payment hooks, certification patterns).

## Surfaces searched and what was found

| Surface | Search terms | Result | Verdict |
|---|---|---|---|
| WebSearch — x402 + MCP composition | `x402 micropayment trust attestation MCP server registry primitive 2026` | x402 protocol (Coinbase, Cloudflare facilitator) — generic; **Vercel `paidTool` primitive** — flat-fee declared on a tool; **AIsa** — large-volume x402 processor; **ZKProofport MCP** — KYC/identity proofs; **MCPay.tech** — MCP+payments hub; **AnChain.AI MCP** — sanctions screening for x402. | All present at the **flat-fee** layer. None modulate fee by destination's runtime trust score. |
| WebSearch — agent-paid trust attestation observatory | `"agent-paid" trust attestation observatory MCP HTTP 402 monetization` | "MCP Server Monetization: Four Models Compared (April 2026)" — x402 / L402 / tollbooth / BTCPay; Visa Trusted Agent Protocol; AnChain trust-layer framing; Crossmint comparison of MPP/ACP/AP2/x402 | Trust attestations exist (AnChain). Behavioral-runtime-trust-modulated pricing does not. |
| `.well-known` URI registry | searched for `agt-trust-routing` and adjacent names; no IANA-registered well-known URI for trust-conditioned routing | empty | Empire registers `/.well-known/agt-trust-routing.json` first. Vocabulary capture. |
| schema.org-adjacent vocabularies | `RoutableReceipt`, `BehavioralFeeTier` — no matches in schema.org or DCAT. | empty | Empire defines `routable_receipt_v0.1` JSON-LD context; canonical-issuer position. |
| ERC numbers | ERC-8004 = trust attestations / agent identity — known, prior art for *attestations*, not for *fee modulation*. | partial overlap (attestation primitives exist) | Empire's primitive layers ABOVE ERC-8004 (use receipts, do not redefine identity). |
| MCP SEPs (Standards Enhancement Proposals) | searched for `paidTool`, `trust-routed`, `behavioral fee` in MCP SEP repo + ecosystem RFCs. | `paidTool` (Vercel) found; trust-routed not found. | Empire claims trust-routed; complements paidTool (flat-fee) by adding the fee-curve dimension. |

## Why what exists is not what the empire is shipping

| Existing thing | What it does | Why it does NOT pre-claim AGT |
|---|---|---|
| Vercel `paidTool` | Declares a flat price on an MCP tool; agent pays at invocation. | Price is **seller-set** and **flat**. AGT prices the **routing decision** by runtime score of the destination. Different primitive. |
| AnChain.AI MCP trust layer | Real-time AML/sanctions screening for x402 transactions. | Screens whether to allow a payment. Does not modulate the fee. AGT modulates. |
| ZKProofport MCP | Zero-knowledge identity proofs (KYC, country, OIDC). | Identity primitive. AGT is a routing primitive. Compose, don't compete. |
| AIsa x402 processor | High-volume x402 settlement infra. | Settlement provider. AGT is upstream — the fee-curve issuer. AIsa could settle AGT receipts. |
| MCPay.tech | MCP+payments hub / aggregator. | Aggregator UI. AGT is the protocol the aggregator would list. |
| ERC-8004 | On-chain trust attestations. | Empire issues receipts that *reference* runtime trust scores; ERC-8004 issues identity attestations. Composable, not duplicative. |
| Visa Trusted Agent Protocol | Trust framework for agent payments (Visa-specced). | Identity + transaction trust at the rail layer. AGT is route-fee modulation at the application layer. Different layer of stack. |

**No prior-art entity has shipped the specific mechanism: x402 fee that is an inverse-monotone function of the destination MCP server's runtime behavioral trust score, settled into a signed routable receipt usable as compliance evidence.**

## Why this asymmetry exists (defensibility argument)

The mechanism requires three things in combination:
1. A live runtime-telemetry corpus across many servers (Observatory has 4,584 servers, 27,776 interactions, 30+ days of data).
2. An x402 issuer position (anyone can be one — low bar).
3. A signed-receipt format that compliance buyers will reference (anyone could publish — but the buyer searches for canonical names).

(1) is the moat. A copier on day 1 has zero hours of comparable telemetry; their pricing has no anchor. By day 30 the copier still has 30 days less telemetry than the empire. (2) and (3) are easy individually but only become defensible WHEN combined with (1). The empire is the only entity with all three.

## Constraint 4 verdict

PASS. The mechanism (behavior-modulated x402 fee + routable receipt anchored on accumulated telemetry) has no prior art. Spec ships at `specs/agt-trust-routing-v0.1.md`.

## Constraint 1 + 2 verdict

PASS. All AGT endpoints are HTTP-callable by software. No human in the conversion path.

## Constraint 3 alignment

Claim is necessary for S\$10K/month under the agent-economy axis. AGT-α is a per-call micro-fee; AGT-β bundles; AGT-γ is a subscription. Revenue arrives as agent traffic arrives — no human bottleneck. CEO ratification of pricing curve in spec §7 sets the run-rate target.

## What this hunt explicitly killed (alternatives considered, rejected)

- **AGT as flat-fee paid endpoints (no behavioral modulation).** Rejected: collapses to Vercel `paidTool` copy. Constraint 4 fail.
- **AGT as a re-spec of ERC-8004 with empire prefix.** Rejected: copies laplace0x's primitive. Constraint 4 fail.
- **AGT marketed primarily to compliance buyers via Dev.to + outreach.** Outreach motion would violate Constraints 1+2. Marketing remains agent-discoverable surfaces only (the `/.well-known/` URI, the spec URL on Observatory, schema.org JSON-LD context, public RFC threads).
- **AGT as a Stripe-MPP-only fallback.** Acceptable as a v0.2 fallback if Coinbase facilitator unstable, but the *primitive* is the trust-modulated curve, not the settlement rail. Curve-first, rail-fallback.

## Open question (logged, not resolved this run)

Could the empire's behavior-modulated curve be "matched" by a competitor who buys Observatory data? No — telemetry buying is not in scope under Constraints 1+2 and the Observatory does not currently sell raw data. A future competitor could attempt to build their own observation corpus, but they cannot retroactively compress 30+ days of empire-collected data. Time-to-replicate is the moat.
