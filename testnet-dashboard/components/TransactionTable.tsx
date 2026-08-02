"use client";

import Link from "next/link";
import type { Block, TxFields } from "@/lib/rpc";
import { formatNumber, shortenAddress, timeAgo } from "@/lib/format";
import { TOKEN_SYMBOL } from "@/lib/chain-config";

export interface FlatTx extends TxFields {
  block: number;
  timestamp: number;
}

/** Flattens blocks -> individual transactions, most recent first. */
export function flattenTransactions(blocks: Block[], limit = 15): FlatTx[] {
  const out: FlatTx[] = [];
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    for (let j = block.transactions.length - 1; j >= 0; j--) {
      out.push({ ...block.transactions[j], block: block.index, timestamp: block.timestamp });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function TransactionTable({ txs }: { txs: FlatTx[] }) {
  if (txs.length === 0) {
    return <p className="text-sm text-muted py-6">No transactions yet.</p>;
  }

  return (
    <div className="-mx-5 sm:mx-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-sm text-muted">
            <th className="font-normal px-5 sm:px-4 py-2.5">Block</th>
            <th className="font-normal px-4 py-2.5">From</th>
            <th className="font-normal px-4 py-2.5">To</th>
            <th className="font-normal px-4 py-2.5 text-right">Amount</th>
            <th className="font-normal px-4 py-2.5 text-right">Age</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((tx, i) => (
            <tr key={`${tx.block}-${i}`} className="border-t border-border">
              <td className="px-5 sm:px-4 py-3">
                <Link
                  href={`/explorer/block/${tx.block}`}
                  className="font-mono text-accent-link hover:underline"
                >
                  {formatNumber(tx.block)}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/explorer/address/${tx.from}`}
                  className="font-mono text-xs hover:text-accent-link hover:underline"
                >
                  {shortenAddress(tx.from)}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/explorer/address/${tx.to}`}
                  className="font-mono text-xs hover:text-accent-link hover:underline"
                >
                  {shortenAddress(tx.to)}
                </Link>
              </td>
              <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                {formatNumber(tx.amount)} {TOKEN_SYMBOL}
              </td>
              <td className="px-4 py-3 text-right text-muted whitespace-nowrap">
                {timeAgo(tx.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
