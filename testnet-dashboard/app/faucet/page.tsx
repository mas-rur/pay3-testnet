"use client";

import { useEffect, useState } from "react";
import { Card, Input, Button, Pill, Dot, ErrorText } from "@/components/ui";
import { getActiveWallet } from "@/lib/wallet";
import { formatDuration, formatNumber, isValidAddress, shortenAddress } from "@/lib/format";
import { TOKEN_SYMBOL, FAUCET_DAILY_LIMIT } from "@/lib/chain-config";
import { IconCopy, IconCheck } from "@/components/icons";

interface FaucetStatus {
  configured: boolean;
  address?: string;
  balance?: number | null;
  amount: number;
  dailyLimit: number;
}

export default function FaucetPage() {
  const [status, setStatus] = useState<FaucetStatus | null>(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ txHash: string; remaining: number } | null>(
    null
  );
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  useEffect(() => {
    setHasWallet(!!getActiveWallet());
    fetch("/api/faucet")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  async function request() {
    setLoading(true);
    setError(null);
    setResult(null);
    setRetryAfter(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "request failed");
        if (typeof body.retryAfterSeconds === "number") {
          setRetryAfter(body.retryAfterSeconds);
        }
        return;
      }
      setResult({ txHash: body.txHash, remaining: body.remaining });
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setLoading(false);
    }
  }

  const ready = status?.configured && status.balance != null && status.balance > 0;

  function copyFaucetAddress() {
    if (!status?.address) return;
    navigator.clipboard.writeText(status.address);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 1500);
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 max-w-2xl">
      <h1 className="font-sans text-2xl font-semibold tracking-tight mb-6">Faucet</h1>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mb-8">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-muted">{TOKEN_SYMBOL}</span>
          <span className="font-sans font-semibold tabular-nums">
            {status?.balance != null ? `${formatNumber(status.balance)} ${TOKEN_SYMBOL}` : "—"}
          </span>
        </div>
        {status?.configured && (
          <Pill tone={ready ? "success" : "danger"}>
            <Dot tone={ready ? "success" : "danger"} />
            {ready ? "Ready" : "Unavailable"}
          </Pill>
        )}
      </div>

      <Card>
        <h2 className="font-sans text-base font-semibold mb-1.5">Recipient Address</h2>
        <p className="text-sm text-muted mb-5">
          Send testnet {TOKEN_SYMBOL} to any address to start testing. Limited to{" "}
          {FAUCET_DAILY_LIMIT} requests per address every 24 hours.
        </p>

        <div className="space-y-3">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            onKeyDown={(e) => e.key === "Enter" && request()}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={request}
              disabled={!isValidAddress(address) || loading || status?.configured === false}
            >
              {loading ? "Requesting..." : `Request ${formatNumber(status?.amount ?? 1000)} ${TOKEN_SYMBOL}`}
            </Button>
            {hasWallet && (
              <button
                onClick={() => setAddress(getActiveWallet()?.address ?? "")}
                className="font-mono text-[11px] uppercase tracking-widest text-accent-link hover:underline"
              >
                Use my wallet
              </button>
            )}
          </div>
        </div>

        {status?.configured === false && (
          <ErrorText>
            Faucet isn&apos;t configured on this deployment yet -- set
            FAUCET_PRIVATE_KEY in the dashboard&apos;s environment variables.
          </ErrorText>
        )}

        {error && (
          <ErrorText>
            {error}
            {retryAfter != null && retryAfter > 0 && (
              <> Try again in {formatDuration(retryAfter)}.</>
            )}
          </ErrorText>
        )}

        {result && (
          <div className="mt-4 rounded-xl bg-success/10 px-4 py-3">
            <p className="font-mono text-xs text-success break-all">
              Sent. tx_hash: {result.txHash}
            </p>
            <p className="font-mono text-[11px] text-muted mt-1">
              {result.remaining} request{result.remaining === 1 ? "" : "s"} left today for this
              address.
            </p>
          </div>
        )}
      </Card>

      {status?.address && (
        <button
          onClick={copyFaucetAddress}
          className="mt-8 inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-foreground"
        >
          Faucet {shortenAddress(status.address)}
          {addressCopied ? (
            <IconCheck width={13} height={13} className="text-success" />
          ) : (
            <IconCopy width={13} height={13} />
          )}
        </button>
      )}
    </div>
  );
}
