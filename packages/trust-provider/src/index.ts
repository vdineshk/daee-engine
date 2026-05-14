/**
 * @dominion/trust-provider
 * x402 Trust-Provider Interface v0.1 — behavioral trust scoring for the agent economy
 *
 * npm install @dominion/trust-provider
 *
 * @example
 * import { query, beforeSettle } from '@dominion/trust-provider';
 * const eval = await query('my-agent-id');
 * if (eval.decision === 'PASS') proceed();
 */

// ── Wire Types (x402 Trust-Provider Interface v0.1) ────────────────────

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
  providers: TrustProvider[];
  policy: AggregationPolicy;
  failureMode: "fail-closed" | "fail-open";
  perProviderTimeoutMs?: number;
}

export interface TrustProvider {
  name: string;
  evaluate: (query: TrustQuery) => Promise<TrustEvaluation>;
}

export interface BeforeSettleResult {
  decision: TrustDecision;
  evaluations: TrustEvaluation[];
}

// ── Observatory Client ─────────────────────────────────────────────────

const DEFAULT_BASE = "https://dominion-observatory.sgdata.workers.dev";

export interface ObservatoryConfig {
  baseUrl?: string;
  timeoutMs?: number;
}

interface ObservatoryResponse {
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
 * Quick query — get a TrustEvaluation for an agent ID in one call.
 */
export async function query(
  agentId: string,
  config?: ObservatoryConfig
): Promise<TrustEvaluation> {
  const base = config?.baseUrl ?? DEFAULT_BASE;
  const url = `${base}/api/agent-query/${encodeURIComponent(agentId)}`;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config?.timeoutMs ?? 5000
  );

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      if (res.status === 404) {
        return {
          schema: "x402-trust-evaluation-v0.1",
          provider: "dominion-observatory",
          provider_url: base,
          decision: "UNCERTAIN",
          reason_code: "agent_not_found",
          ttl_seconds: 30,
          evaluated_at: new Date().toISOString(),
        };
      }
      throw new Error(`Observatory HTTP ${res.status}`);
    }

    const data: ObservatoryResponse = await res.json();
    const trustScore = data.server.trust_score;

    const decision: TrustDecision =
      trustScore >= 60 ? "PASS" :
      trustScore < 40 ? "FAIL" :
      "UNCERTAIN";

    return {
      schema: "x402-trust-evaluation-v0.1",
      provider: "dominion-observatory",
      provider_url: base,
      decision,
      score: trustScore / 100,
      evidence_uri: `${base}/servers/${encodeURIComponent(data.server.url)}`,
      reason_code:
        trustScore >= 60 ? "behavioral_trust_above_silver" :
        trustScore < 40 ? "behavioral_trust_below_bronze" :
        "behavioral_trust_review_band",
      ttl_seconds: 60,
      evaluated_at: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Create an Observatory TrustProvider for use with beforeSettle.
 */
export function createObservatoryProvider(
  config?: ObservatoryConfig
): TrustProvider {
  return {
    name: "dominion-observatory",
    evaluate: (q: TrustQuery) =>
      query(q.payer.agent_id ?? q.payer.wallet ?? "unknown", config),
  };
}

// ── Aggregation ────────────────────────────────────────────────────────

export function aggregateStrict(evals: TrustEvaluation[]): TrustDecision {
  if (evals.some((e) => e.decision === "FAIL")) return "FAIL";
  if (evals.some((e) => e.decision === "UNCERTAIN")) return "UNCERTAIN";
  return "PASS";
}

export function aggregateQuorum(evals: TrustEvaluation[]): TrustDecision {
  const n = evals.length;
  const threshold = Math.ceil(n / 2);
  const f = evals.filter((e) => e.decision === "FAIL").length;
  const p = evals.filter((e) => e.decision === "PASS").length;
  if (f >= threshold) return "FAIL";
  if (p >= threshold && f === 0) return "PASS";
  return "UNCERTAIN";
}

// ── beforeSettle Hook ──────────────────────────────────────────────────

/**
 * Run the full beforeSettle hook: queries all providers in parallel,
 * applies aggregation policy, returns final decision + all evaluations.
 *
 * @example
 * const { decision } = await beforeSettle(trustQuery, {
 *   providers: [createObservatoryProvider()],
 *   policy: { kind: 'strict' },
 *   failureMode: 'fail-closed',
 * });
 */
export async function beforeSettle(
  q: TrustQuery,
  config: BeforeSettleConfig
): Promise<BeforeSettleResult> {
  const timeout = config.perProviderTimeoutMs ?? 250;

  const evaluations = await Promise.all(
    config.providers.map(async (provider) => {
      try {
        return await Promise.race([
          provider.evaluate(q),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), timeout)
          ),
        ]);
      } catch {
        return {
          schema: "x402-trust-evaluation-v0.1" as const,
          provider: provider.name,
          provider_url: "error",
          decision: (config.failureMode === "fail-closed"
            ? "UNCERTAIN"
            : "PASS") as TrustDecision,
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

// ── Advisory Headers ───────────────────────────────────────────────────

/**
 * Generate x402 advisory response headers from a BeforeSettleResult.
 */
export function advisoryHeaders(
  result: BeforeSettleResult
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Trust-Decision": result.decision,
  };
  const first = result.evaluations[0];
  if (first?.score !== undefined) {
    headers["X-Trust-Score"] = first.score.toFixed(3);
  }
  if (first?.evidence_uri) {
    headers["X-Trust-Evidence-URI"] = first.evidence_uri;
  }
  if (first?.provider) {
    headers["X-Trust-Provider"] = first.provider;
  }
  return headers;
}
