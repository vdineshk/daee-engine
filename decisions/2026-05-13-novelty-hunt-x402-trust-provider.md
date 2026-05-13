# NOVELTY-HUNT — x402 Trust-Provider Interface (S32-A)

RUN-040 | 2026-05-13 | Builder

## Candidate primitive

**x402 Trust-Provider Interface (v0.1)** — a server-side composable
attestation hook plugging into x402 V2's documented `beforeSettle` /
settlement-verification lifecycle hook, allowing servers to consult
one or more TrustProvider endpoints (each returning a normalized
trust evaluation) before authorizing payment settlement.

Subject-reversed: today's emerging x402 trust mechanics, where any
exist at all, live on the **wallet/client side** (clients choose
which servers to pay). This spec inverts the direction — **server
side** filters incoming agent requests by behavioral attestation
before letting the facilitator settle. The server is the trust
subject.

## C4 prior-art search (6 surfaces, 2026-05-13)

### Surface 1: x402 V2 Launch Notes (canonical)

`https://www.x402.org/writing/x402-v2-launch` — fetched 2026-05-13.

**Found**: Lifecycle hooks documented for "before/after sending a
payment, before/after settlement verification" with stated purpose
of "conditional payment routing, custom metrics, complex failure
recovery mechanisms, and more."

**Not found**: trust-provider interface, behavioral attestation hook,
trust-scoring middleware, composable trust, server-side trust filter.

Verdict: hooks exist; no standard trust-provider plug shape defined.

### Surface 2: x402 official welcome doc

`https://docs.cdp.coinbase.com/x402/welcome` — fetched 2026-05-13.

**Found**: facilitator pattern (`/verify` + `/settle`), Bazaar
extension (service discovery), gas sponsorship (Permit2),
Sign-in-with-x (CAIP-122 auth).

**Not found**: named hooks, trust-provider interface, behavioral
attestation, conformance scoring.

Verdict: no trust-provider primitive.

### Surface 3: Coinbase docs llms.txt index

`https://docs.cdp.coinbase.com/llms.txt` — fetched 2026-05-13.

**Found**: single x402 welcome URL; no dedicated server SDK / hook /
middleware / extension page enumerated in the index.

Verdict: trust-provider surface unclaimed at the documentation
discovery layer.

### Surface 4: Web search "x402 protocol beforeSettle OR before-settle trust provider interface specification"

Google search 2026-05-13. 10 results returned. None reference a
trust-provider interface, behavioral attestation hook, or composable
trust primitive on the `beforeSettle` surface. Coverage spans Eco
support article, agentpaytrend.com 2026 security overview, Coinbase
docs, ChatForest protocol stack guide, Cloudflare blog, dwellir.com
explainer, x402 V2 launch post, Simplescraper guide, Sherlock post,
Medium article.

Verdict: zero prior art across consumer-discovery surfaces.

### Surface 5: Web search "x402 Foundation Linux Foundation working group trust scoring server-side middleware specification"

Google search 2026-05-13. 10 results returned. All relate to the LF
launch announcement, Foundation membership, governance. None
reference a trust-scoring middleware spec, server-side trust filter
spec, or any composable trust interface.

Verdict: foundation has no active spec on this surface.

### Surface 6: Empire memory cross-check

`memory_recall_by_tag(["builder","novelty-ledger"])` 2026-05-13.
Empire's 7 prior CTEF-cohort primitives (validator, attest,
ecosystem, readiness, well-known/ctef-conformance, trust-badge, GH
Action) and 1 content draft cover the **CTEF** surface — none plug
into the x402 lifecycle hook layer.

Verdict: empire alone on this slot; no duplicate-of risk.

## C4 verdict: PASS

Zero prior art across 6 surfaces. Spec slot is unclaimed.

## Constitutional checks

- **C1** Agent economy only — x402 Foundation is a public,
  agent-readable standards surface at the Linux Foundation. ✅
- **C2** No human sales — submission is a GitHub PR / public
  discussion thread, not outreach. ✅
- **C3** Compounding toward SGD 10K — every x402-paying server that
  adopts the interface needs a TrustProvider endpoint; empire's
  `/v1/behavioral-evidence/{server_id}` is the obvious zero-config
  reference. Adoption → recurring agent-economy traffic on
  empire-shipped CTEF endpoints. ✅
- **C4** Originality — zero prior art (above). ✅
- **C5** Free-tier infrastructure — LF working group participation
  costs $0; submission via GitHub PR. ✅

## HARD RULE checks

- **HARD RULE 19** AI-disclosure required — spec includes "Authoring"
  section. ✅
- **HARD RULE 20** modelcontextprotocol moratorium — x402 ≠
  modelcontextprotocol. ✅
- **HARD RULE 22** callability exhaustion test — N/A (this is option
  (c) chokepoint, not option (b) callability wrapper for an
  existing primitive). ✅
- **HARD RULE 23** moratorium-no-evasion — Builder Moratorium
  (2026-05-10) is superseded for this specific work by newer S32-A
  directive (2026-05-12) which explicitly authorizes spec drafting
  at LF chokepoint. Not evasion; explicit authorization. ✅

## Empire claim

- Spec draft path: `specs/x402-trust-provider-interface/v0.1/SPEC.md`
- Reference implementation: `https://dominion-observatory.sgdata.workers.dev/v1/behavioral-evidence/{server_id}`
  (CTEF v0.3.2 §4.5 conformant, mcp-behavioral-evidence-v1.0 schema)
- LF/x402 submission surface: x402 Foundation GitHub once available;
  Strategist owns maintainer relationship + amplification per S32-A
- Empire is alone on this slot. Compounding accelerates when x402
  V2.1 / V3 adopts the interface and Coinbase / Cloudflare / Stripe
  middleware ships a default TrustProvider hook reference list.

## Next extension

Once v0.1 submitted: draft v0.2 incorporating WG feedback; ship a
TypeScript reference middleware (`@dominion/x402-trust-provider`) on
empire-tier infra; ensure CTEF v0.3.2 §4.5 evidence URI is the
canonical reference TrustProvider implementation in v0.2.
