import { NextResponse } from "next/server";
import { addressFromPrivateKey, signTransfer } from "@/lib/wallet";
import { isValidAddress } from "@/lib/format";
import { FAUCET_AMOUNT, FAUCET_DAILY_LIMIT } from "@/lib/chain-config";

// Needs Node's crypto internals (via ethers) rather than the edge runtime.
export const runtime = "nodejs";

const RPC_URL = (process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8080").replace(
  /\/$/,
  ""
);
const WINDOW_SECONDS = 24 * 60 * 60;

/**
 * Serializes faucet sends within this server instance so two concurrent
 * requests don't read the same account nonce and race each other. This is
 * an in-memory lock -- it does NOT coordinate across multiple serverless
 * instances. Fine for a low-traffic devnet faucet; a busier one would want
 * a shared lock/nonce store instead.
 */
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function getFaucetSigner() {
  const key = process.env.FAUCET_PRIVATE_KEY;
  if (!key) return null;
  try {
    return { privateKey: key.trim(), address: addressFromPrivateKey(key) };
  } catch {
    return null;
  }
}

async function nodeGet(path: string) {
  const res = await fetch(`${RPC_URL}${path}`, { cache: "no-store" });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || `request failed (${res.status})`);
  return body;
}

async function nodePost(path: string, payload: unknown) {
  const res = await fetch(`${RPC_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || `request failed (${res.status})`);
  return body;
}

export async function GET() {
  const signer = getFaucetSigner();
  if (!signer) {
    return NextResponse.json(
      { configured: false, amount: FAUCET_AMOUNT, dailyLimit: FAUCET_DAILY_LIMIT },
      { status: 200 }
    );
  }

  try {
    const account = await nodeGet(`/account/${signer.address}`);
    return NextResponse.json({
      configured: true,
      address: signer.address,
      balance: account.balance as number,
      amount: FAUCET_AMOUNT,
      dailyLimit: FAUCET_DAILY_LIMIT,
    });
  } catch (e) {
    return NextResponse.json(
      {
        configured: true,
        address: signer.address,
        balance: null,
        amount: FAUCET_AMOUNT,
        dailyLimit: FAUCET_DAILY_LIMIT,
        error: e instanceof Error ? e.message : "could not reach node",
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  let address: string;
  try {
    const body = await request.json();
    address = String(body?.address ?? "");
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  if (!isValidAddress(address)) {
    return NextResponse.json({ error: "enter a valid 0x... address" }, { status: 400 });
  }

  const signer = getFaucetSigner();
  if (!signer) {
    return NextResponse.json(
      { error: "faucet is not configured on this deployment (missing FAUCET_PRIVATE_KEY)" },
      { status: 503 }
    );
  }

  return withLock(async () => {
    try {
      // Source of truth for the rate limit is the chain itself: how many
      // times has the faucet sent to this address in the last 24h?
      const history = await nodeGet(`/history/${address}`);
      const now = Math.floor(Date.now() / 1000);
      const recent = (history.history as Array<{
        direction: string;
        counterparty: string;
        timestamp: number;
      }>).filter(
        (e) =>
          e.direction === "received" &&
          e.counterparty.toLowerCase() === signer.address.toLowerCase() &&
          now - e.timestamp < WINDOW_SECONDS
      );

      if (recent.length >= FAUCET_DAILY_LIMIT) {
        const oldest = recent.reduce((min, e) => Math.min(min, e.timestamp), Infinity);
        const retryAfterSeconds = Math.max(0, oldest + WINDOW_SECONDS - now);
        return NextResponse.json(
          {
            error: `daily limit reached (${FAUCET_DAILY_LIMIT} requests / 24h for this address)`,
            retryAfterSeconds,
            remaining: 0,
          },
          { status: 429 }
        );
      }

      const faucetAccount = await nodeGet(`/account/${signer.address}`);
      if (faucetAccount.balance < FAUCET_AMOUNT) {
        return NextResponse.json(
          { error: "faucet is out of funds -- contact the network operator" },
          { status: 503 }
        );
      }

      const tx = signTransfer(
        signer.privateKey,
        address,
        BigInt(FAUCET_AMOUNT),
        BigInt(faucetAccount.nonce)
      );
      const result = await nodePost("/tx", tx);

      return NextResponse.json({
        txHash: result.tx_hash as string,
        amount: FAUCET_AMOUNT,
        remaining: FAUCET_DAILY_LIMIT - recent.length - 1,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "faucet request failed" },
        { status: 500 }
      );
    }
  });
}
