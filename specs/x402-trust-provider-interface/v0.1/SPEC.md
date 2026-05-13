# x402 Trust-Provider Interface — v0.1 (Draft)

**Title**: Server-Side Composable Trust-Provider Interface for x402
**Slug**: `x402-trust-provider-interface`
**Version**: 0.1.0
**Status**: DRAFT — submitted for x402 Foundation Working Group review
**Track**: x402 Extension (server-side lifecycle)
**Required**: x402 V2 (lifecycle hooks: settlement verification)
**Date**: 2026-05-13
**Discussion**: (to be opened on x402 Foundation discussion surface
once available)

---

## Abstract

x402 V2 documents lifecycle hooks for "before/after settlement
verification" but does not define a normalized interface for the
common case of consulting one or more **trust evaluators** before
authorizing settlement. This document proposes a small, transport-
neutral **TrustProvider** interface that x402 servers can plug into
the documented settlement-verification hook to obtain a normalized
trust decision (PASS / FAIL / UNCERTAIN), optional numeric score, and
attestation evidence URI for the incoming payer (agent or wallet).

The interface is **subject-reversed** from emerging wallet-side
"server trust scoring": instead of clients scoring servers, **servers
score incoming agent requests** before letting the facilitator settle
the payment. The interface is **composable**: a server may chain N
TrustProvider endpoints with declarative aggregation policy. The
interface is **provider-agnostic**: any HTTP endpoint returning the
defined JSON envelope is a conformant TrustProvider.

This spec defines the wire contract only. It does not mandate any
specific trust algorithm, evidence schema, or attestation framework.

## Status of This Memo

This is a draft submission for the x402 Foundation Working Group.
The interface is currently implemented by one reference provider
(Dominion Observatory, behavioral attestation per CTEF v0.3.2 §4.5).
This document does not represent a consensus position; it is the
author's contribution to the standards process. Implementation
feedback, edits, and counter-proposals are explicitly invited via
the discussion thread once opened on the Foundation surface.

## Authoring

This draft was produced with AI assistance (Claude). The interface
shape, prior-art search, reference implementation pointer, and
worked examples were drafted by the author with AI-assisted writing
and refinement. The behavioral attestation reference implementation
predates this draft. Per the disclosure norm increasingly adopted
for AI-assisted standards work (and consistent with author's
operating principle on spec submissions), this disclosure appears
in the body of the spec, not in an out-of-band channel.

## 1. Motivation

The agent economy is moving past "any agent can call any paying
endpoint" toward a model where servers are expected to make trust
decisions about incoming requests at the HTTP boundary, before
settlement. The current x402 V2 baseline supports this through its
documented lifecycle hooks, but there is no shared shape for what a
trust evaluator returns to the server. As a result:

1. **Servers cannot compose evaluators.** A server wanting both a
   behavioral-attestation check (e.g., "this agent has a runtime
   trust score") and a sanctions check (e.g., "this wallet is not
   on a blocklist") must today write provider-specific glue code
   for each. There is no `&&` of decisions.

2. **Evaluators cannot interoperate.** A behavioral-attestation
   provider, a sanctions provider, and a captcha-equivalent
   provider each ship their own response shape. Servers cannot
   route traffic across multiple evaluators behind a single policy
   surface.

3. **Wallet-side scoring is one-sided.** Emerging "trust dashboards"
   for x402 score the *server* from the *client's* perspective.
   The reverse direction — the server's view of the incoming agent
   — is the operationally critical one for protecting the server
   against fraud, abuse, and behavioral drift, and is not
   standardized.

4. **The settlement-verification hook is the right place.** Trust
   evaluation must happen before the facilitator settles, because
   USDC settlement on Base is effectively irreversible at the
   protocol layer. After-the-fact mitigation is expensive. The
   x402 V2 hook is documented but unused for this purpose.

This spec defines the minimal interface required to plug ≥1
**TrustProvider** into that hook, and to compose multiple providers.

## 2. Terminology

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**,
**SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**,
and **OPTIONAL** in this document are to be interpreted as described
in BCP 14 / RFC 2119 / RFC 8174 when, and only when, they appear in
all capitals.

- **Server**: the resource holder that returns HTTP 402 and later
  HTTP 200 once payment is settled, per x402.
- **Payer**: the agent / wallet / client signing the payment payload.
- **Facilitator**: the x402 facilitator handling `/verify` and
  `/settle`.
- **TrustProvider**: an HTTP endpoint conformant to this spec that
  returns a TrustEvaluation for a payer.
- **TrustEvaluation**: the JSON object returned by a TrustProvider
  (see §4).
- **Aggregation Policy**: the server-defined rule for combining
  multiple TrustEvaluation results into one Decision.

## 3. Interface Overview

The interface attaches at x402 V2's documented "before settlement
verification" hook. Operationally:

```
[1] Client → Server: HTTP GET /resource
                     PAYMENT-SIGNATURE: <signed payload>

[2] Server hook: beforeSettle()
    For each configured TrustProvider P_i:
        POST P_i with TrustQuery (see §4.1)
        Receive TrustEvaluation (see §4.2)
    Apply Aggregation Policy → Decision
    If Decision = FAIL: return HTTP 402 with x-trust-decision: FAIL
                        (no facilitator call)
    If Decision = UNCERTAIN: per server policy (fail-open or
                              fail-closed; default RECOMMENDED
                              fail-closed for new connections)
    If Decision = PASS: continue to facilitator /verify + /settle

[3] Server → Facilitator: /verify + /settle (standard x402 V2)

[4] Server → Client: HTTP 200 + resource, plus advisory headers
                     x-trust-decision, x-trust-score (OPTIONAL),
                     x-trust-evidence-uri (OPTIONAL)
```

A TrustProvider call **MUST NOT** itself initiate a settlement. A
TrustProvider call **MUST NOT** mutate the payer's payment state.
A TrustProvider is **purely advisory**: it returns a decision about
the payer; the server retains policy authority and the facilitator
retains settlement authority.

## 4. The TrustProvider Interface

### 4.1 TrustQuery (Server → TrustProvider)

A server queries a TrustProvider via HTTP POST. The request body
**MUST** be a JSON object with the following shape:

```json
{
  "schema": "x402-trust-query-v0.1",
  "payer": {
    "wallet": "0x...",                  // OPTIONAL; chain-native address
    "agent_id": "string",               // OPTIONAL; agent identifier
    "session_id": "string"              // OPTIONAL; x402 V2 session id
  },
  "resource": {
    "url": "https://...",               // REQUIRED; the server resource URL
    "method": "GET",                    // OPTIONAL
    "amount": {                         // OPTIONAL; the payment amount
      "value": "0.001",
      "currency": "USDC",
      "chain": "base"
    }
  },
  "context": {                          // OPTIONAL; arbitrary server context
    "category": "string",
    "risk_band": "low|medium|high"
  },
  "requested_at": "RFC3339 timestamp"    // REQUIRED
}
```

At least one of `payer.wallet`, `payer.agent_id`, or
`payer.session_id` **MUST** be present. The TrustProvider **MAY**
return UNCERTAIN if it has no record for the provided identifiers.

### 4.2 TrustEvaluation (TrustProvider → Server)

The TrustProvider **MUST** respond with HTTP 200 (success) or HTTP
5xx (transient failure). A 4xx response indicates a malformed query
and **MUST NOT** be retried by the server in the same beforeSettle
window.

The success body **MUST** be a JSON object with the following shape:

```json
{
  "schema": "x402-trust-evaluation-v0.1",
  "provider": "string",                  // REQUIRED; opaque provider id
  "provider_url": "https://...",         // REQUIRED; canonical URL
  "decision": "PASS|FAIL|UNCERTAIN",     // REQUIRED
  "score": 0.0,                          // OPTIONAL; 0.0..1.0 inclusive
  "evidence_uri": "https://...",         // OPTIONAL; per-subject evidence
  "reason_code": "string",               // OPTIONAL; machine-readable
  "ttl_seconds": 60,                     // OPTIONAL; cache hint
  "evaluated_at": "RFC3339 timestamp"    // REQUIRED
}
```

- `decision` is the normative output. Servers and aggregation
  policies operate on this field.
- `score` is advisory. Different providers normalize differently;
  scores from different providers **MUST NOT** be averaged unless
  explicitly declared as comparable in the aggregation policy.
- `evidence_uri` SHOULD be a stable URL pointing to behavioral
  evidence (e.g., a CTEF v0.3.2 §4.5 behavioral-evidence record).
  The server **MAY** include this URI in the response back to the
  client for transparency.
- `ttl_seconds` allows the server to cache the evaluation for the
  same `(payer, resource)` pair. If omitted, the server **SHOULD**
  treat the evaluation as single-use.

### 4.3 Decision Codes

- **PASS**: The provider asserts the payer is in good standing for
  this resource. Settlement **MAY** proceed.
- **FAIL**: The provider asserts the payer is not in good standing.
  Settlement **MUST NOT** proceed solely on the basis of this
  provider's evaluation; the server **MUST** apply its aggregation
  policy (see §5).
- **UNCERTAIN**: The provider has insufficient data, the payer is
  unknown, or evaluation is unavailable. The server **MUST NOT**
  treat UNCERTAIN as either PASS or FAIL by default; it is a third
  state requiring explicit policy.

The choice of three states (rather than boolean) is deliberate.
Two-state interfaces force providers to choose between false-positives
and false-negatives at the wire layer; this displaces the policy
decision to the wrong actor. UNCERTAIN keeps policy at the server.

## 5. Aggregation Policy

A server configured with N TrustProvider endpoints **MUST** combine
the N TrustEvaluations into a single Decision before calling the
facilitator. The aggregation policy is server-local; this spec
defines two normative defaults and permits custom policies.

### 5.1 STRICT (default RECOMMENDED for new connections)

```
Decision = FAIL  if any provider returned FAIL
        UNCERTAIN if any provider returned UNCERTAIN (and none FAIL)
        PASS      if all providers returned PASS
```

STRICT minimizes false-PASS at the cost of higher FAIL/UNCERTAIN
rates. Recommended for new payers (no session history with the
server).

### 5.2 QUORUM

```
Let p = count(PASS), f = count(FAIL), u = count(UNCERTAIN), n = N
Decision = FAIL      if f >= ceil(n/2)
         PASS        if p >= ceil(n/2) and f == 0
         UNCERTAIN   otherwise
```

QUORUM tolerates single-provider failures (e.g., a TrustProvider
endpoint experiencing transient downtime returning UNCERTAIN).
Recommended for established sessions where settlement velocity
matters more than per-call fraud protection.

### 5.3 Custom

A server **MAY** define a custom policy. Custom policies **MUST**
preserve the invariant: if any provider's decision is FAIL **and**
the policy outputs PASS, the server **MUST** record this divergence
in a server-local audit log (rationale: divergent overrides are
where fraud patterns hide).

## 6. Failure-Mode Semantics

A TrustProvider endpoint **MAY** be unreachable. The server's
behavior is policy-driven:

- **fail-closed** (default RECOMMENDED): treat unreachable
  TrustProvider as UNCERTAIN. Combined with STRICT aggregation,
  this halts settlement when any provider is down.
- **fail-open**: treat unreachable TrustProvider as PASS for that
  evaluator. Permissible only when an explicit business case
  documents the risk.

Servers **MUST NOT** retry a TrustProvider beyond a single attempt
within a single beforeSettle window. Trust evaluation latency budgets
are typically <100ms per provider; retry loops cascade into x402
latency targets. Implementations **SHOULD** parallelize
TrustProvider calls when N > 1.

A server's beforeSettle latency budget **SHOULD NOT** exceed the
facilitator's `/verify` latency budget by more than 2x.

## 7. Wire Headers

The following advisory headers are defined for use on the server's
HTTP 402 / HTTP 200 response after a beforeSettle decision:

- `X-Trust-Decision: PASS|FAIL|UNCERTAIN` — REQUIRED when any
  TrustProvider was consulted.
- `X-Trust-Score: 0.0..1.0` — OPTIONAL composite score (server-
  defined aggregation).
- `X-Trust-Evidence-URI: https://...` — OPTIONAL; URI of the
  primary provider's evidence record. If multiple providers
  returned evidence URIs, the server **MAY** emit one header per
  provider or a single composite URI per server policy.
- `X-Trust-Provider: <provider id>` — OPTIONAL; identifies which
  provider's evaluation drove the decision (relevant when STRICT
  aggregation FAILs on a single provider).

These headers are **advisory only**. Clients **MUST NOT** treat
their absence as either PASS or FAIL.

## 8. Security Considerations

- **Authentication of TrustProvider responses**: this v0.1 spec does
  not mandate signing of TrustEvaluation bodies. A v0.2 revision
  may define an HTTP-message-signatures (RFC 9421) profile for
  TrustEvaluations. Until then, server operators **SHOULD** use
  mTLS or shared-secret HMAC at the transport layer when the
  TrustProvider is not co-located.
- **Payer identifier disclosure**: TrustQuery may carry wallet
  addresses and agent IDs to third-party providers. Servers
  **MUST** disclose TrustProvider integration in their service
  terms or `.well-known/trust-providers` (see §9.2 future work).
- **Evidence URI integrity**: if a provider's `evidence_uri` is
  served from a different origin than the provider, the server
  **SHOULD** verify that the evidence URI references the same
  payer identifier supplied in the query.
- **Denial of service via false-FAIL**: a malicious TrustProvider
  could uniformly return FAIL. Servers SHOULD include a
  TrustProvider health-check (independent ping) in their operator
  monitoring; sustained false-FAIL rates indicate a provider
  defect or compromise.

## 9. Reference Implementation

### 9.1 Behavioral-attestation TrustProvider (live)

A reference TrustProvider implementing this v0.1 interface is
available at:

```
https://dominion-observatory.sgdata.workers.dev/v1/behavioral-evidence/{server_id}
```

This endpoint returns CTEF v0.3.2 §4.5 conformant behavioral
evidence records (schema `mcp-behavioral-evidence-v1.0`) and is
adaptable to the TrustEvaluation envelope defined in §4.2 via a
thin transform:

```python
# Reference adapter (Python pseudocode)
def adapt_observatory_to_trust_evaluation(observatory_response, payer):
    return {
        "schema": "x402-trust-evaluation-v0.1",
        "provider": "dominion-observatory",
        "provider_url": "https://dominion-observatory.sgdata.workers.dev",
        "decision": (
            "PASS" if observatory_response["trust_score"] >= 60
            else "FAIL" if observatory_response["trust_score"] < 40
            else "UNCERTAIN"
        ),
        "score": observatory_response["trust_score"] / 100,
        "evidence_uri": observatory_response["attestation_source"],
        "reason_code": (
            "behavioral_trust_above_silver_threshold"
            if observatory_response["trust_score"] >= 60
            else "behavioral_trust_below_bronze_threshold"
        ),
        "ttl_seconds": 60,
        "evaluated_at": observatory_response["observed_at"],
    }
```

A native (no-adapter) TrustProvider mode emitting the v0.1
envelope directly is planned for the empire's reference
implementation in v0.2.

### 9.2 Future work — `.well-known/trust-providers`

A v0.2 revision may define a `.well-known/trust-providers` JSON
resource served by x402 servers, enumerating the providers a server
consults and their aggregation policy. This enables clients to
inspect server trust posture before paying, closing the loop with
emerging wallet-side trust dashboards (which today have no
canonical way to read server policy).

## 10. Worked Example

A server `https://example-paid-api.com/resource` accepts USDC
payments via x402 V2 and is configured with two TrustProviders:
the Dominion Observatory behavioral-attestation TrustProvider
(P1) and an OFAC-compliance TrustProvider (P2, hypothetical).
Aggregation policy: STRICT, fail-closed.

```
[1] Client → Server:
    GET /resource
    PAYMENT-SIGNATURE: <signed payload, agent_id=acme-bot-001,
                       wallet=0xabc..., amount=0.001 USDC>

[2] Server beforeSettle:
    POST P1 (Dominion Observatory)
        {schema: x402-trust-query-v0.1,
         payer: {wallet: 0xabc..., agent_id: acme-bot-001},
         resource: {url: https://example-paid-api.com/resource,
                    amount: {value: 0.001, currency: USDC,
                             chain: base}},
         requested_at: 2026-05-13T01:23:45Z}
    Response:
        {schema: x402-trust-evaluation-v0.1,
         provider: dominion-observatory,
         provider_url: https://dominion-observatory.sgdata.workers.dev,
         decision: PASS, score: 0.925,
         evidence_uri: https://dominion-observatory.sgdata.workers.dev/v1/behavioral-evidence/acme-bot-001,
         reason_code: behavioral_trust_above_silver_threshold,
         ttl_seconds: 60,
         evaluated_at: 2026-05-13T01:23:45Z}

    POST P2 (OFAC TrustProvider)
        (same query)
    Response:
        {schema: x402-trust-evaluation-v0.1,
         provider: ofac-screen-example,
         decision: PASS, ttl_seconds: 3600,
         evaluated_at: 2026-05-13T01:23:45Z}

[3] STRICT aggregation: PASS && PASS = PASS

[4] Server → Facilitator: /verify + /settle (standard x402 V2)

[5] Server → Client: HTTP 200
    X-Trust-Decision: PASS
    X-Trust-Score: 0.96
    X-Trust-Evidence-URI: https://dominion-observatory.sgdata.workers.dev/v1/behavioral-evidence/acme-bot-001
```

## 11. Open Questions for the Working Group

1. Should `TrustEvaluation` be signed by default in v0.1, or is
   the deferred-to-v0.2 path acceptable?
2. Should the aggregation policy be declared in the server's
   `.well-known/trust-providers` (for client inspectability) or
   remain server-local-only?
3. Should `UNCERTAIN` from any provider override `PASS` from all
   others by default, or is this a per-server policy?
4. Is a single `decision` field sufficient, or should providers
   also emit a `risk_category` (e.g., `sanctions`, `behavioral`,
   `liveness`, `rate-limit-abuse`) for typed aggregation?
5. Should this interface live under `x402-trust-*` or a separate
   project umbrella (e.g., `trust-providers-rfc` independent of
   x402)? The interface is genuinely useful outside x402 (any
   HTTP-payment protocol with a settlement-verification hook).

## 12. Appendix A — TypeScript Interface

```typescript
// x402-trust-provider-interface v0.1

export interface TrustQuery {
  schema: "x402-trust-query-v0.1";
  payer: {
    wallet?: string;
    agent_id?: string;
    session_id?: string;
  };
  resource: {
    url: string;
    method?: string;
    amount?: {
      value: string;
      currency: string;
      chain: string;
    };
  };
  context?: {
    category?: string;
    risk_band?: "low" | "medium" | "high";
  };
  requested_at: string; // RFC3339
}

export type TrustDecision = "PASS" | "FAIL" | "UNCERTAIN";

export interface TrustEvaluation {
  schema: "x402-trust-evaluation-v0.1";
  provider: string;
  provider_url: string;
  decision: TrustDecision;
  score?: number; // 0.0..1.0
  evidence_uri?: string;
  reason_code?: string;
  ttl_seconds?: number;
  evaluated_at: string; // RFC3339
}

export interface TrustProvider {
  evaluate(query: TrustQuery): Promise<TrustEvaluation>;
}

export type AggregationPolicy =
  | { kind: "strict" }
  | { kind: "quorum" }
  | { kind: "custom"; combine: (evals: TrustEvaluation[]) => TrustDecision };

export interface BeforeSettleConfig {
  providers: TrustProvider[];
  policy: AggregationPolicy;
  failureMode: "fail-closed" | "fail-open";
  perProviderTimeoutMs?: number; // default 250
}
```

## 13. Appendix B — JSON Schema (informative)

A JSON Schema (Draft 2020-12) for `TrustQuery` and `TrustEvaluation`
will be published alongside this spec in
`specs/x402-trust-provider-interface/v0.1/schema/` once v0.1 is
accepted for further review.

## 14. References

- x402 V2 launch notes — `https://www.x402.org/writing/x402-v2-launch`
- x402 welcome — `https://docs.cdp.coinbase.com/x402/welcome`
- x402 Foundation (Linux Foundation, launched 2026-04-02)
- CTEF v0.3.2 §4.5 — behavioral evidence (publication target
  2026-05-19)
- RFC 9421 — HTTP Message Signatures (for v0.2 signing profile)
- RFC 2119 / RFC 8174 — Key words for use in RFCs
- BCP 14

---

**End of v0.1 draft.** Implementation feedback, edits, and
counter-proposals are invited via the x402 Foundation discussion
surface once opened. Until then, the canonical home for this draft
is `specs/x402-trust-provider-interface/v0.1/SPEC.md` in the
author's working repository.
