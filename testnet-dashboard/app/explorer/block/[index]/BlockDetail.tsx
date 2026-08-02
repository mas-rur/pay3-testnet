"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { rpc, type Block } from "@/lib/rpc";
import { Card, ErrorText, SectionHeading } from "@/components/ui";
import { CopyField } from "@/components/CopyField";
import { formatNumber, shortenAddress, timeAgo } from "@/lib/format";
import { TOKEN_SYMBOL } from "@/lib/chain-config";
import { IconChevronLeft } from "@/components/icons";

export function BlockDetail({ index }: { index: string }) {
  const [block, setBlock] = useState<Block | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    rpc
      .block(Number(index))
      .then((b) => !cancelled && setBlock(b))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "lookup failed"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [index]);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 max-w-4xl">
      <Link
        href="/explorer"
        className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-muted hover:text-foreground mb-6"
      >
        <IconChevronLeft width={14} height={14} />
        Explorer
      </Link>

      <h1 className="font-sans text-2xl font-semibold tracking-tight mb-6">
        Block {formatNumber(Number(index))}
      </h1>

      {loading && <p className="font-mono text-xs text-muted">Loading...</p>}
      {error && <ErrorText>{error}</ErrorText>}

      {block && (
        <>
          <Card className="mb-6 space-y-4">
            <Row label="Timestamp" value={`${timeAgo(block.timestamp)}`} />
            <Row label="Transactions" value={String(block.transactions.length)} />
            <CopyField label="Hash" value={block.hash} />
            <CopyField label="Previous hash" value={block.prev_hash} />
            <CopyField label="State root" value={block.state_root} />
          </Card>

          <Card>
            <SectionHeading title="Transactions" />
            {block.transactions.length === 0 && (
              <p className="font-mono text-xs text-muted py-2">
                No transactions in this block.
              </p>
            )}
            {block.transactions.length > 0 && (
              <div className="divide-y divide-border">
                {block.transactions.map((tx, i) => (
                  <div key={i} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <Link
                      href={`/explorer/address/${tx.from}`}
                      className="font-mono text-xs hover:text-accent-link hover:underline"
                    >
                      {shortenAddress(tx.from)}
                    </Link>
                    <span className="text-muted text-xs">&#8594;</span>
                    <Link
                      href={`/explorer/address/${tx.to}`}
                      className="font-mono text-xs hover:text-accent-link hover:underline"
                    >
                      {shortenAddress(tx.to)}
                    </Link>
                    <span className="ml-auto font-mono text-xs tabular-nums">
                      {formatNumber(tx.amount)} {TOKEN_SYMBOL}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {label}
      </span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
