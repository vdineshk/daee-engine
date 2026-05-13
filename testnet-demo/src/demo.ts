#!/usr/bin/env npx tsx
/**
 * x402 Trust-Provider Testnet Demo
 *
 * End-to-end flow:
 *   1. Query Dominion Observatory for agent trust score
 *   2. Run beforeSettle hook (STRICT aggregation, fail-closed)
 *   3. If PASS -> execute USDC transfer on Base Sepolia
 *   4. Emit x-trust-* response headers (simulated)
 *
 * Usage:
 *   DRY_RUN=1 npx tsx src/demo.ts        # dry run
 *   PRIVATE_KEY=0x... npx tsx src/demo.ts # live testnet
 */

import { createPublicClient, createWalletClient, http, parseAbi, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  type TrustQuery,
  type TrustDecision,
  type BeforeSettleConfig,
  observatoryEvaluate,
  beforeSettle,
} from "./trust-provider.js";

// Config
const DRY_RUN = process.env.DRY_RUN === "1" || !process.env.PRIVATE_KEY;
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const ERC3009_ABI = parseAbi([
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);
const DEMO_AGENT_ID = "sg-cpf-calculator";
const PAYMENT_AMOUNT = "0.01";
const PAYMENT_VALUE = BigInt(10_000); // 0.01 USDC (6 decimals)
const RECIPIENT = "0x000000000000000000000000000000000000dEaD" as const;

// Helpers
function banner(msg: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${msg}`);
  console.log(`${"=".repeat(60)}\n`);
}

function printHeaders(decision: TrustDecision, score?: number, evidenceUri?: string) {
  console.log("  Response headers (x402 advisory):");
  console.log(`    X-Trust-Decision: ${decision}`);
  if (score !== undefined) console.log(`    X-Trust-Score: ${score.toFixed(3)}`);
  if (evidenceUri) console.log(`    X-Trust-Evidence-URI: ${evidenceUri}`);
}

// Main
async function main() {
  banner("x402 Trust-Provider Testnet Demo");
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (no on-chain tx)" : "LIVE (Base Sepolia)"}`);
  console.log(`  Agent: ${DEMO_AGENT_ID}`);
  console.log(`  Payment: ${PAYMENT_AMOUNT} USDC -> ${RECIPIENT}`);

  // Step 1: Construct TrustQuery
  banner("Step 1: Construct TrustQuery");
  const query: TrustQuery = {
    schema: "x402-trust-query-v0.1",
    payer: {
      agent_id: DEMO_AGENT_ID,
      wallet: DRY_RUN ? "0x0000000000000000000000000000000000000000" : undefined,
    },
    resource: {
      url: "https://example-paid-api.com/resource",
      method: "GET",
      amount: { value: PAYMENT_AMOUNT, currency: "USDC", chain: "base-sepolia" },
    },
    context: { category: "government-data", risk_band: "low" },
    requested_at: new Date().toISOString(),
  };
  console.log("  TrustQuery:", JSON.stringify(query, null, 2));

  // Step 2: beforeSettle hook
  banner("Step 2: beforeSettle (query Observatory + aggregate)");
  const config: BeforeSettleConfig = {
    providers: [
      { name: "dominion-observatory", evaluate: observatoryEvaluate },
    ],
    policy: { kind: "strict" },
    failureMode: "fail-closed",
    perProviderTimeoutMs: 5000,
  };

  const { decision, evaluations } = await beforeSettle(query, config);

  for (const ev of evaluations) {
    console.log(`  Provider: ${ev.provider}`);
    console.log(`    Decision: ${ev.decision}`);
    if (ev.score !== undefined) console.log(`    Score: ${ev.score}`);
    console.log(`    Reason: ${ev.reason_code ?? "none"}`);
    if (ev.evidence_uri) console.log(`    Evidence: ${ev.evidence_uri}`);
  }

  console.log(`\n  +--------------------------------------+`);
  console.log(`  |  Aggregated Decision: ${decision.padEnd(13)} |`);
  console.log(`  +--------------------------------------+`);

  // Step 3: Gate settlement
  if (decision === "FAIL") {
    banner("Step 3: SETTLEMENT BLOCKED");
    console.log("  beforeSettle returned FAIL. No facilitator call.");
    printHeaders(decision, evaluations[0]?.score, evaluations[0]?.evidence_uri);
    process.exit(0);
  }

  if (decision === "UNCERTAIN") {
    banner("Step 3: SETTLEMENT HELD (fail-closed)");
    console.log("  beforeSettle returned UNCERTAIN. Under STRICT + fail-closed, blocked.");
    printHeaders(decision, evaluations[0]?.score, evaluations[0]?.evidence_uri);
    process.exit(0);
  }

  banner("Step 3: SETTLEMENT AUTHORIZED (PASS)");
  console.log("  Trust gate passed. Proceeding to facilitator /verify + /settle.");

  // Step 4: On-chain transfer
  if (DRY_RUN) {
    banner("Step 4: On-chain transfer (DRY RUN)");
    console.log("  Would execute: USDC.transfer(recipient, 10000)");
    console.log(`  Chain: Base Sepolia (${baseSepolia.id})`);
    console.log(`  USDC: ${USDC_ADDRESS}`);
    console.log(`  To: ${RECIPIENT}`);
    console.log(`  Amount: ${PAYMENT_AMOUNT} USDC (${PAYMENT_VALUE} raw)`);
    console.log("\n  Set PRIVATE_KEY env var to execute live on testnet.");
    printHeaders(decision, evaluations[0]?.score, evaluations[0]?.evidence_uri);
    banner("Demo complete (dry run)");
    return;
  }

  // Live mode
  banner("Step 4: On-chain transfer (Base Sepolia)");
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
  console.log(`  Signer: ${account.address}`);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  const balance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC3009_ABI,
    functionName: "balanceOf",
    args: [account.address],
  });

  console.log(`  USDC balance: ${Number(balance) / 1e6} USDC`);
  if (balance < PAYMENT_VALUE) {
    console.log("  Insufficient USDC. Get testnet USDC from https://faucet.circle.com/");
    process.exit(1);
  }

  console.log(`  Sending ${PAYMENT_AMOUNT} USDC to ${RECIPIENT}...`);
  const hash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: ERC3009_ABI,
    functionName: "transfer",
    args: [RECIPIENT, PAYMENT_VALUE],
  });

  console.log(`  Tx hash: ${hash}`);
  console.log(`  Explorer: https://sepolia.basescan.org/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  Status: ${receipt.status === "success" ? "CONFIRMED" : "FAILED"}`);
  console.log(`  Block: ${receipt.blockNumber}`);

  banner("Step 5: Server response (HTTP 200 + advisory headers)");
  printHeaders(decision, evaluations[0]?.score, evaluations[0]?.evidence_uri);
  console.log(`    X-Trust-Provider: dominion-observatory`);
  console.log(`    X-Settlement-Tx: ${hash}`);

  banner("Demo complete (live testnet)");
}

main().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
