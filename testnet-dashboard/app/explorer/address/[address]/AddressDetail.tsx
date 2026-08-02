"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { rpc, type Account, type HistoryEvent } from "@/lib/rpc";
import { Card, ErrorText, Panel, SectionHeading } from "@/components/ui";
import { CopyField } from "@/components/CopyField";
import { formatNumber, timeAgo } from "@/lib/format";
import { TOKEN_SYMBOL } from "@/lib/chain-config";
import { IconChevronLeft, IconArrowDownLeft, IconArrowUpRight } from "@/components/icons";

export function AddressDetail({ address }: { address: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [history, setHistory] = useState<HistoryEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([rpc.account(address), rpc.history(address)])
      .then(([acct, hist]) => {
        if (cancelled) return;
        setAccount(acct);
        setHistory(hist.history);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "lookup failed"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 max-w-4xl">
      <Link
        href="/explorer"
        className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-muted hover:text-foreground mb-6"
      >
        <IconChevronLeft width={14} height={14} />
        Explorer
      </Link>

      <h1 className="font-sans text-2xl font-semibold tracking-tight mb-6">Address</h1>

      {loading && <p className="font-mono text-xs text-muted">Loading...</p>}
      {error && <ErrorText>{error}</ErrorText>}

      {account && (
        <>
          <Card className="mb-6 space-y-4">
            <CopyField label="Address" value={account.address} />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Panel>
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1">
                  Balance
                </div>
                <div className="font-sans text-xl font-semibold tabular-nums">
                  {formatNumber(account.balance)} {TOKEN_SYMBOL}
                </div>
              </Panel>
              <Panel>
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1">
                  Nonce
                </div>
                <div className="font-sans text-xl font-semibold tabular-nums">
                  {account.nonce}
                </div>
              </Panel>
            </div>
          </Card>

          <Card>
            <SectionHeading title="Transaction history" />
            {history && history.length === 0 && (
              <p className="font-mono text-xs text-muted py-2">No transactions yet.</p>
            )}
            {history && history.length > 0 && (
              <div className="divide-y divide-border">
                {history.map((e) => (
                  <div
                    key={e.tx_hash}
                    className="py-3 flex items-center gap-3 text-sm"
                  >
                    {e.direction === "sent" ? (
                      <IconArrowUpRight width={16} height={16} className="text-danger shrink-0" />
                    ) : (
                      <IconArrowDownLeft width={16} height={16} className="text-success shrink-0" />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/explorer/address/${e.counterparty}`}
                        className="font-mono text-xs hover:text-accent-link hover:underline block truncate"
                      >
                        {e.direction === "sent" ? "To " : "From "}
                        {e.counterparty}
                      </Link>
                      <span className="font-mono text-[11px] text-muted">
                        Block {e.block} &middot; {timeAgo(e.timestamp)}
                      </span>
                    </div>
                    <span
                      className={`ml-auto font-mono text-xs tabular-nums whitespace-nowrap ${
                        e.direction === "sent" ? "text-danger" : "text-success"
                      }`}
                    >
                      {e.direction === "sent" ? "-" : "+"}
                      {formatNumber(e.amount)} {TOKEN_SYMBOL}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
