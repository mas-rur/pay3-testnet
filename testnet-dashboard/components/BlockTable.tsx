"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Block } from "@/lib/rpc";
import { formatNumber, timeAgo } from "@/lib/format";

export function BlockTable({ blocks }: { blocks: Block[] }) {
  // re-render every few seconds so "age" columns stay fresh
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 4000);
    return () => clearInterval(id);
  }, []);

  if (blocks.length === 0) {
    return <p className="text-sm text-muted py-6">No blocks yet.</p>;
  }

  return (
    <div className="-mx-5 sm:mx-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-sm text-muted">
            <th className="font-normal px-5 sm:px-4 py-2.5">Block</th>
            <th className="font-normal px-4 py-2.5">Txs</th>
            <th className="font-normal px-4 py-2.5 text-right">Age</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((block) => {
            const fresh = Date.now() / 1000 - block.timestamp < 5;
            return (
              <tr
                key={block.index}
                className={`border-t border-border ${fresh ? "row-fresh" : ""}`}
              >
                <td className="px-5 sm:px-4 py-3">
                  <Link
                    href={`/explorer/block/${block.index}`}
                    className="font-mono text-accent-link hover:underline"
                  >
                    {formatNumber(block.index)}
                  </Link>
                </td>
                <td className="px-4 py-3 tabular-nums">{block.transactions.length}</td>
                <td className="px-4 py-3 text-right text-muted whitespace-nowrap">
                  {timeAgo(block.timestamp)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
