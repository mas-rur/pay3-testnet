"use client";

import { useMemo } from "react";
import { useChainData } from "@/components/shell/ChainDataProvider";
import { StatCard } from "@/components/StatCard";
import { BlockTable } from "@/components/BlockTable";
import { SearchBar } from "@/components/SearchBar";
import { Card, SectionHeading, ErrorText } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { CHAIN_NAME } from "@/lib/chain-config";
import Link from "next/link";

export default function Home() {
  const { chain, connected, error } = useChainData();

  const stats = useMemo(() => {
    if (!chain) return { blocks: 0, txs: 0, addresses: 0 };
    let txs = 0;
    const addresses = new Set<string>();
    for (const block of chain.blocks) {
      for (const tx of block.transactions) {
        txs++;
        addresses.add(tx.from.toLowerCase());
        addresses.add(tx.to.toLowerCase());
      }
    }
    return { blocks: chain.height, txs, addresses: addresses.size };
  }, [chain]);

  const latestBlocks = useMemo(() => {
    if (!chain) return [];
    return [...chain.blocks].reverse().slice(0, 8);
  }, [chain]);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 max-w-4xl">
      <h1 className="font-sans text-2xl sm:text-3xl font-semibold tracking-tight mb-1">
        {CHAIN_NAME}
      </h1>
      <p className="text-muted text-sm mb-6">
        A live look at every block, transaction, and address on the network.
      </p>

      <SearchBar className="mb-8" />

      {error && connected === false && (
        <ErrorText>Can&apos;t reach the node ({error}). Is l1_node running?</ErrorText>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatCard label="Blocks" value={formatNumber(stats.blocks)} />
        <StatCard label="Transactions" value={formatNumber(stats.txs)} />
        <StatCard label="Addresses" value={formatNumber(stats.addresses)} />
      </div>

      <Card>
        <SectionHeading
          title="Latest Blocks"
          action={
            <Link
              href="/explorer"
              className="font-mono text-[11px] uppercase tracking-widest text-accent-link hover:underline"
            >
              View all
            </Link>
          }
        />
        <BlockTable blocks={latestBlocks} />
      </Card>
    </div>
  );
}
