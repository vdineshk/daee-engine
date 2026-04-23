# Official MCP Registry submission bundle — RUN-019 (2026-04-23)

Three schema-validated `server.json` files for publishing to the Official MCP
Registry via `mcp-publisher`. Namespace `io.github.vdineshk/*` binds to
@vdineshk's GitHub OAuth — this is the only account that can publish these.

## Files

| File | Name | Version | Remote |
|---|---|---|---|
| `io.github.vdineshk.sg-regulatory-data.server.json` | `io.github.vdineshk/sg-regulatory-data` | 1.1.0 | https://sg-regulatory-data-mcp.sgdata.workers.dev/mcp |
| `io.github.vdineshk.sg-cpf-calculator.server.json` | `io.github.vdineshk/sg-cpf-calculator` | 1.1.0 | https://sg-cpf-calculator-mcp.sgdata.workers.dev/mcp |
| `io.github.vdineshk.sg-company-lookup.server.json` | `io.github.vdineshk/sg-company-lookup` | 1.1.0 | https://sg-company-lookup-mcp.sgdata.workers.dev/mcp |

## Registry ground truth at bundle time (2026-04-23 ~01:15 UTC)

- `registry.modelcontextprotocol.io/v0/servers?limit=1` → **HTTP 200** (stable after yesterday's 503 drift)
- `registry.modelcontextprotocol.io/v0/publish` → **HTTP 400** on empty POST (endpoint alive, body-validated)
- `static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json` → **HTTP 200**
- Each file schema-validated locally with `jsonschema==4.26.0` against `ServerDetail` before commit.

## Runtime evidence captured during this run (ADAPTATION rule: cite live observations)

- `sg-regulatory-data-mcp` / `sg-cpf-calculator-mcp` / `sg-company-lookup-mcp` all returned HTTP 503 on first `/mcp` POST (cold start) then 200 on warm retry. Trust score reporting is honest: cold-start latency is a real field signal, not a bug to hide.
- `asean-trade-rules-mcp` stayed 503 on two retries — deliberately excluded from this bundle.

## Dinesh action — exact commands (2 minutes)

> Run from any shell with a writable current directory. Requires a browser tab
> open to https://github.com/login/device when the login step prints a code.

```bash
# 1. install mcp-publisher (official Go CLI, single binary) — Linux/macOS
curl -LsSf \
  https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_linux_amd64.tar.gz \
  | tar xz -C /tmp
export PATH="/tmp:$PATH"
mcp-publisher --version

# 2. authenticate against the Official Registry (GitHub OAuth device flow)
#    You'll see: "Enter CODE at https://github.com/login/device"
mcp-publisher login github

# 3. publish each server (from repo root)
cd ~/path/to/daee-engine   # adjust to your clone
mcp-publisher publish registry-submissions/io.github.vdineshk.sg-regulatory-data.server.json
mcp-publisher publish registry-submissions/io.github.vdineshk.sg-cpf-calculator.server.json
mcp-publisher publish registry-submissions/io.github.vdineshk.sg-company-lookup.server.json
```

### Verify success

```bash
for name in sg-regulatory-data sg-cpf-calculator sg-company-lookup; do
  echo "=== $name ==="
  curl -sS "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.vdineshk/$name" \
    | python3 -m json.tool | head -40
done
```

Expected: each response shows `"status": "active"` with a recent `publishedAt`
timestamp. PulseMCP ingests from the Official Registry automatically — these
three will propagate without further submission.

### If `mcp-publisher login github` fails in a headless shell

Use the device flow on any browser:
1. Run `mcp-publisher login github` — it prints a short code.
2. Visit https://github.com/login/device on ANY device.
3. Enter the code, authorize `modelcontextprotocol/registry`.
4. The CLI unblocks and writes credentials to `~/.config/mcp-publisher`.

### Rollback

`mcp-publisher` does not support delete. To deprecate a published server, bump
version and re-publish with `_meta.io.modelcontextprotocol.registry/official.status = "deprecated"`.

## Why this matters (context for Dinesh)

The Official MCP Registry is the canonical source feeding PulseMCP,
Glama-registry-ingest, and several smaller directories. Three publishes =
four-plus new discovery surfaces per server, no extra work. The same
servers have already been on Smithery + mcp.so for 2+ weeks with zero organic
calls — Official Registry is the last untested discovery surface before we
accept "listings alone don't drive demand" as a permanent Genome rule.

## Why NOT yet

- `asean-trade-rules-mcp` — 503 on two warm retries this run. Excluded until stable.
- `sg-workpass-compass-mcp` — `/health` intermittent 503 even after warm /mcp 200. Excluded until `/health` stabilises.
- `dominion-observatory` — held back intentionally; the Observatory publishes itself as metadata for every other server, listing it as a peer server dilutes the positioning.
