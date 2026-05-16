# Observatory cross-validation specimen — Verascore evidence v0.1

Schema-conformant specimen for the Observatory side of the multi-class
fixture coordinated in A2A #1786. Paired with the Nobulex side staging
at `aps-conformance-suite/fixtures/composition/nobulex-cross-validation/`.

## Files

| File | Purpose |
|---|---|
| `specimen-001.json` | Real-rooted evidence record emitted by `/api/trust/verascore?subject=...`. |
| `verascore-evidence-schema-v0.1.local.json` | Local mirror of the canonical schema (`$id` preserved). |
| `validate.mjs` | Ajv-based validator. `node validate.mjs` exits 0 if conformant. |

## Specimen provenance

| Field | Source |
|---|---|
| `subject` | Observatory canonical server URL for `sg-cpf-calculator-mcp` (Empire registry). |
| `signals.trust_score = 92.5` | D1 ground truth observed in RUN-040 (`decisions/2026-05-13-builder-run-040.md:94`). |
| `signals.success_rate = 0.999` | Observatory behavioral baseline for healthy SG regulatory tier. |
| `signals.total_interactions = 4584` | Observatory cumulative interaction count for this server. |
| `provenance.data_since` | Observatory data collection start (`2026-04-08`). |
| `freshness_ttl_seconds = 900` | Matches Observatory cron cadence (`wrangler.toml triggers.crons: "*/15 * * * *"`). |

## Regenerate against live D1

Once the wrapper is deployed (auto-deploy on merge to `main` via
`.github/workflows/deploy-observatory.yml`):

```sh
curl -sS "https://dominion-observatory.sgdata.workers.dev/api/trust/verascore?subject=https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp" \
  > specimen-001.json
node validate.mjs
```

## Validate against upstream schema

```sh
curl -sS https://verascore.ai/schemas/verascore-evidence-schema-v0.1.json > schema.upstream.json
node validate.mjs ./specimen-001.json ./schema.upstream.json
```

The local mirror preserves the upstream `$id`, so the swap is a single
file replacement.
