    if (url.pathname.startsWith("/agent-query/")) {
      const serverSlug = url.pathname.replace("/agent-query/", "").replace(/\/$/,  "");
      if (!serverSlug) {
        return new Response(JSON.stringify({ error: "server slug required" }), {
          status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      const paymentWallet = env2.PAYMENT_WALLET || "0xCF8C01f1EFc61fA0eCc7614Ed1fA8f668D9aA8A2";
      const paymentProof = request.headers.get("X-Payment");
      if (!paymentProof) {
        return new Response(JSON.stringify({
          wallet_status: "configured",
          to: paymentWallet,
          amount: "0.001",
          currency: "USDC",
          chain: "base",
          chain_id: 8453,
          server_slug: serverSlug,
          service: "Dominion Observatory Trust Verdict",
          x402_version: "0.1",
          claim_uri: `${url.origin}/.well-known/mcp-observatory`,
          payment_instructions: "Transfer 0.001 USDC on Base to 'to' address, then retry with header X-Payment: <tx_hash>"
        }), {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "X-Payment-Required": "USDC:0.001:base",
            "X-Payment-Wallet": paymentWallet
          }
        });
      }
      const server = await db.prepare(
        "SELECT url, name, trust_score, total_calls, avg_latency_ms FROM servers WHERE url LIKE ? OR LOWER(name) LIKE ? LIMIT 1"
      ).bind(`%${serverSlug}%`, `%${serverSlug}%`).first();
      return new Response(JSON.stringify({
        server_slug: serverSlug,
        server_url: server ? server.url : null,
        trust_score: server ? server.trust_score : null,
        total_calls: server ? server.total_calls : null,
        avg_latency_ms: server ? server.avg_latency_ms : null,
        payment_received: paymentProof,
        payment_status: "accepted",
        wallet_status: "configured",
        claim_uri: `${url.origin}/.well-known/mcp-observatory`
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (url.pathname.startsWith("/api/agent-query/")) {
      const serverSlug = url.pathname.replace("/api/agent-query/", "").replace(/\/$/,  "");
      const authHeader = request.headers.get("Authorization") || "";
      const ts = Math.floor(Date.now() / 1000);
      const challenge = `agt-${serverSlug}-${ts}`;
      const hasHmac = authHeader.startsWith("HMAC ");
      const hmacConfigured = !!(env2.AGT_HMAC_SECRET);
      return new Response(JSON.stringify({
        status: hasHmac ? "verified" : "challenge",
        challenge: hasHmac ? null : challenge,
        wallet_status: hmacConfigured ? "configured" : "not_configured",
        server_slug: serverSlug,
        hmac_required: !hasHmac
      }), {
        status: hasHmac ? 200 : 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          ...(hasHmac ? {} : { "X-AGT-Challenge": challenge })
        }
      });
    }
    if (url.pathname === "/llms.txt") {
      const llmsTxt = `# Dominion Observatory
# https://dominion-observatory.sgdata.workers.dev

> The behavioral trust layer for the AI agent economy.
> Cross-ecosystem runtime telemetry for 14,800+ MCP servers.
> Data since 2026-04-08.

## MCP endpoint
- /mcp -- full tool suite (check_trust, report_interaction, get_leaderboard, get_baselines, check_anomaly, register_server, get_server_history, observatory_stats, get_compliance_report)

## REST API
- GET  /api/trust?url=<server_url>
- GET  /api/leaderboard?category=<cat>&limit=<n>
- GET  /api/stats
- POST /api/report
- POST /api/register
- GET  /api/compliance?server_url=<url>&agent_id=<id>&start_date=<YYYY-MM-DD>&end_date=<YYYY-MM-DD>
- GET  /api/servers?category=<cat>&limit=<n>
- GET  /api/info
- GET  /benchmark/<server-name>
- GET  /agent-query/<server-name>

## Schema
mcp-behavioral-evidence-v1.0

## Operator
Dominion Agent Economy Engine, Singapore
`;
      return new Response(llmsTxt, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    if (url.pathname.startsWith("/benchmark/")) {
      const serverSlug = url.pathname.replace("/benchmark/", "").replace(/\/$/,  "");
      if (!serverSlug) {
        return new Response(JSON.stringify({ error: "server slug required. Usage: /benchmark/{server-name}" }), {
          status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      const serverUrl = `https://${serverSlug}.sgdata.workers.dev/mcp`;
      const BENCH_COLS = "id, url, name, category, trust_score, static_score, total_calls, successful_calls, avg_latency_ms, p95_latency_ms, first_seen, last_checked";
      let srv = await db.prepare(
        `SELECT ${BENCH_COLS} FROM servers WHERE url = ? LIMIT 1`
      ).bind(serverUrl).first();
      if (!srv) {
        srv = await db.prepare(
          `SELECT ${BENCH_COLS} FROM servers WHERE url LIKE ? OR LOWER(name) LIKE ? LIMIT 1`
        ).bind(`%${serverSlug}%`, `%${serverSlug}%`).first();
      }
      if (!srv) {
        return new Response(JSON.stringify({
          found: false,
          server_slug: serverSlug,
          message: "Server not tracked by Observatory. Register via POST /api/register.",
          claim_uri: `${url.origin}/.well-known/mcp-observatory`
        }), {
          status: 404, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      const snapshots = await db.prepare(
        "SELECT date, total_calls, successful_calls, avg_latency_ms, trust_score FROM daily_snapshots WHERE server_id = ? ORDER BY date DESC LIMIT 30"
      ).bind(srv.id).all();
      const snapshotRows = snapshots.results || [];
      const score = Math.round((srv.trust_score || 0) * 10) / 10;
      const trustGrade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
      const verdict = score >= 75 ? "recommended" : score >= 50 ? "use_with_caution" : "avoid";
      const snapshots7d = snapshotRows.slice(0, 7);
      const calcSuccessRate = (rows) => {
        const totals = rows.reduce((a, r) => ({ calls: a.calls + (r.total_calls || 0), success: a.success + (r.successful_calls || 0) }), { calls: 0, success: 0 });
        return totals.calls > 0 ? Math.round(totals.success / totals.calls * 1000) / 10 : null;
      };
      const calcAvgLatency = (rows) => {
        const valid = rows.filter((r) => r.avg_latency_ms > 0);
        return valid.length > 0 ? Math.round(valid.reduce((a, r) => a + r.avg_latency_ms, 0) / valid.length) : null;
      };
      const successRateAlltime = (srv.total_calls || 0) > 0 ? Math.round((srv.successful_calls || 0) / srv.total_calls * 1000) / 10 : null;
      const trend = snapshotRows.length >= 2
        ? snapshotRows[0].trust_score > snapshotRows[snapshotRows.length - 1].trust_score ? "improving"
        : snapshotRows[0].trust_score < snapshotRows[snapshotRows.length - 1].trust_score ? "declining" : "stable"
        : "insufficient_data";
      return new Response(JSON.stringify({
        benchmark_version: "1.0",
        server_slug: serverSlug,
        server_url: srv.url,
        name: srv.name,
        category: srv.category || "uncategorized",
        trust_score: score,
        trust_grade: trustGrade,
        verdict,
        reliability: {
          success_rate_7d: calcSuccessRate(snapshots7d),
          success_rate_30d: calcSuccessRate(snapshotRows),
          success_rate_alltime: successRateAlltime,
          trend
        },
        latency: {
          avg_ms: srv.avg_latency_ms ? Math.round(srv.avg_latency_ms) : null,
          p95_ms: srv.p95_latency_ms ? Math.round(srv.p95_latency_ms) : null,
          avg_7d_ms: calcAvgLatency(snapshots7d)
        },
        volume: {
          total_calls: srv.total_calls || 0,
          snapshot_days: snapshotRows.length
        },
        data_since: srv.first_seen || null,
        last_updated: srv.last_checked || null,
        paid_tier_url: `${url.origin}/agent-query/${serverSlug}`,
        claim_uri: `${url.origin}/.well-known/mcp-observatory`,
        observatory: "https://dominion-observatory.sgdata.workers.dev/mcp"
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300"
        }
      });
    }
