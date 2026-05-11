# CTEF Conformance Check (GitHub Action)

A composite GitHub Action that verifies an MCP server against **CTEF v0.3.2 §4.5
behavioral-evidence conformance** criteria, using runtime telemetry from
[Dominion Observatory](https://dominion-observatory.sgdata.workers.dev).

For each pull request it posts a checklist of the 6 CTEF criteria with
per-criterion remediation steps, a generated conformance-document URL, and a
ready-to-paste README badge.

This is the first GitHub Action that checks CTEF v0.3.2 conformance and the
first that integrates with a behavioral-evidence registry (rather than parsing
static metadata).

## Quick start

```yaml
# .github/workflows/ctef-conformance.yml
name: CTEF Conformance
on:
  pull_request:
permissions:
  contents: read
  pull-requests: write
jobs:
  ctef:
    runs-on: ubuntu-latest
    steps:
      - uses: vdineshk/daee-engine/actions/ctef-conformance-check@main
        with:
          server_id: my-mcp-server
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Replace `my-mcp-server` with the slug Observatory tracks for your server. If you
do not know your slug, query
`https://dominion-observatory.sgdata.workers.dev/api/leaderboard` or check the
URL slug at `https://dominion-observatory.sgdata.workers.dev/server/<slug>`.

## What it checks

The action calls
`GET /api/ctef/readiness/{server_id}` and reports on the six CTEF v0.3.2
criteria:

| Criterion | CTEF section | Description |
|---|---|---|
| `behavioral_evidence` | §4.5 | ≥10 interactions captured |
| `negative_path_envelope` | §2.1.1 | CTEF-compliant `SUBJECT_NOT_TRACKED` shape |
| `sla_tier_classified` | §3.4 | Server placed into Platinum/Gold/Silver/Bronze tier |
| `behavioral_drift_flag` | §4.5.6 | Drift signal evaluated from ≥2 daily snapshots |
| `trust_grade_assigned` | — | Behavioral trust grade A–F derived from runtime score |
| `conformance_uri` | §4.5 | `/.well-known/ctef-conformance` deployed on the server |

Each failing criterion comes back with a `fix` field describing exactly what to
ship next. The action surfaces those fixes verbatim in the PR comment and in
the GitHub job summary.

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `server_id` | yes | — | Observatory slug for your MCP server |
| `observatory_url` | no | `https://dominion-observatory.sgdata.workers.dev` | Override only for testing |
| `fail_on_non_compliant` | no | `false` | Set `true` to gate merging on `ready_for_ctef==true` |
| `comment_on_pr` | no | `true` | Post a PR comment with conformance summary |
| `ctef_version` | no | `0.3.2` | Action fails if Observatory reports a different spec version |

## Outputs

| Output | Description |
|---|---|
| `readiness_grade` | `PASS`, `PARTIAL`, or `FAIL` |
| `readiness_score` | Number of criteria passed (0–6) |
| `readiness_max` | Maximum possible criteria count |
| `ready_for_ctef` | Boolean — passes all criteria |
| `trust_grade` | Behavioral trust grade A–F |
| `trust_score` | Numeric score 0–100 |
| `evidence_uri` | CTEF §4.5 `behavioral_evidence` URI for this server |
| `attestation_uri` | URL of generated conformance document (`/api/ctef/attest`) |
| `badge_markdown` | Ready-to-paste README badge |

## Gating merges on CTEF conformance

```yaml
- uses: vdineshk/daee-engine/actions/ctef-conformance-check@main
  with:
    server_id: my-mcp-server
    fail_on_non_compliant: 'true'
```

The action exits non-zero if `ready_for_ctef` is not `true`, so a required
status check on this workflow gates merges until all six criteria pass.

## Reading outputs in later steps

```yaml
- id: ctef
  uses: vdineshk/daee-engine/actions/ctef-conformance-check@main
  with:
    server_id: my-mcp-server

- name: Update README badge
  if: steps.ctef.outputs.readiness_grade == 'PASS'
  run: |
    echo "Trust grade ${{ steps.ctef.outputs.trust_grade }}, score ${{ steps.ctef.outputs.trust_score }}"
    echo "Evidence: ${{ steps.ctef.outputs.evidence_uri }}"
```

## Why this exists

CTEF v0.3.2 publishes 2026-05-19. The spec calls for runtime
behavioral-evidence registries to host conformance verdicts at canonical URIs
(see §4.5 + §4.5.6). Dominion Observatory is the reference behavioral-evidence
provider cited in the spec; this action is the first agent-economy primitive
that lets MCP server maintainers fail their CI when they regress against any
of the six CTEF criteria, with the exact remediation step delivered inline.

## License

Apache 2.0. See repository root for full text.
