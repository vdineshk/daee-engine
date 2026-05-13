/**
 * x402 Trust-Provider Interface v0.1 — TypeScript types & Observatory adapter
 *
 * Implements the wire types from:
 *   specs/x402-trust-provider-interface/v0.1/SPEC.md
 *
 * Reference TrustProvider: Dominion Observatory behavioral attestation
 */

// Wire types (from SPEC.md section 4 / Appendix A)

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
  requested_at: string;
}

export type TrustDecision = "PASS" | "FAIL" | "UNCERTAIN";

export interface TrustEvaluation {
  schema: "x402-trust-evaluation-v0.1";
  provider: string;
  provider_url: string;
  decision: TrustDecision;
  score?: number;
  evidence_uri?: string;
  reason_code?: string;
  ttl_seconds?: number;
  evaluated_at: string;
}

export type AggregationPolicy =
  | { kind: "strict" }
  | { kind: "quorum" }
  | { kind: "custom"; combine: (evals: TrustEvaluation[]) => TrustDecision };

export interface BeforeSettleConfig {
  providers: { name: string; evaluate: (query: TrustQuery) => Promise<TrustEvaluation> }[];
  policy: AggregationPolicy;
  failureMode: "fail-closed" | "fail-open";
  perProviderTimeoutMs?: number;
}

// Observatory adapter

const OBSERVATORY_BASE = "https://dominion-observatory.sgdata.workers.dev";

interface ObservatoryAgentQueryResponse {
  server: {
    name: string;
    url: string;
    category: string;
    trust_score: number;
    registered_at: string;
  };
  metrics: {
    total_interactions: number;
    avg_latency_ms: number;
    success_rate: number | null;
  };
  attestation: {
    provider: string;
    spec: string;
  };
}

/**
 * Queries the Dominion Observatory REST API and adapts the response
 * into a spec-conformant TrustEvaluation.
 */
export async function observatoryEvaluate(query: TrustQuery): Promise<TrustEvaluation> {
  const agentId = query.payer.agent_id ?? query.payer.wallet ?? "unknown";
  const url = `${OBSERVATORY_BASE}/api/agent-query/${encodeURIComponent(agentId)}`;

  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      return {
        schema: "x402-trust-evaluation-v0.1",
        provider: "dominion-observatory",
        provider_url: OBSERVATORY_BASE,
        decision: "UNCERTAIN",
        reason_code: "agent_not_found",
        ttl_seconds: 30,
        evaluated_at: new Date().toISOString(),
      };
    }
    throw new Error(`Observatory HTTP ${res.status}`);
  }

  const data: ObservatoryAgentQueryResponse = await res.json();
  const trustScore = data.server.trust_score;

  const decision: TrustDecision =
    trustScore >= 60 ? "PASS" :
    trustScore < 40 ? "FAIL" :
    "UNCERTAIN";

  return {
    schema: "x402-trust-evaluation-v0.1",
    provider: "dominion-observatory",
    provider_url: OBSERVATORY_BASE,
    decision,
    score: trustScore / 100,
    evidence_uri: `${OBSERVATORY_BASE}/servers/${encodeURIComponent(data.server.url)}`,
    reason_code:
      trustScore >= 60 ? "behavioral_trust_above_silver_threshold" :
      trustScore < 40 ? "behavioral_trust_below_bronze_threshold" :
      "behavioral_trust_in_review_band",
    ttl_seconds: 60,
    evaluated_at: new Date().toISOString(),
  };
}

// Aggregation engine (section 5)

export function aggregateStrict(evals: TrustEvaluation[]): TrustDecision {
  if (evals.some(e => e.decision === "FAIL")) return "FAIL";
  if (evals.some(e => e.decision === "UNCERTAIN")) return "UNCERTAIN";
  return "PASS";
}

export function aggregateQuorum(evals: TrustEvaluation[]): TrustDecision {
  const n = evals.length;
  const threshold = Math.ceil(n / 2);
  const f = evals.filter(e => e.decision === "FAIL").length;
  const p = evals.filter(e => e.decision === "PASS").length;
  if (f >= threshold) return "FAIL";
  if (p >= threshold && f === 0) return "PASS";
  return "UNCERTAIN";
}

/**
 * Runs the full beforeSettle hook: queries all providers in parallel,
 * applies aggregation policy, returns final decision + all evaluations.
 */
export async function beforeSettle(
  query: TrustQuery,
  config: BeforeSettleConfig
): Promise<{ decision: TrustDecision; evaluations: TrustEvaluation[] }> {
  const timeout = config.perProviderTimeoutMs ?? 250;

  const evaluations = await Promise.all(
    config.providers.map(async (provider) => {
      try {
        const result = await Promise.race([
          provider.evaluate(query),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), timeout)
          ),
        ]);
        return result;
      } catch (err) {
        console.warn(`[beforeSettle] Provider ${provider.name} error:`, err);
        return {
          schema: "x402-trust-evaluation-v0.1" as const,
          provider: provider.name,
          provider_url: "error",
          decision: (config.failureMode === "fail-closed" ? "UNCERTAIN" : "PASS") as TrustDecision,
          reason_code: "provider_error",
          evaluated_at: new Date().toISOString(),
        };
      }
    })
  );

  let decision: TrustDecision;
  switch (config.policy.kind) {
    case "strict":
      decision = aggregateStrict(evaluations);
      break;
    case "quorum":
      decision = aggregateQuorum(evaluations);
      break;
    case "custom":
      decision = config.policy.combine(evaluations);
      break;
  }

  return { decision, evaluations };
}
