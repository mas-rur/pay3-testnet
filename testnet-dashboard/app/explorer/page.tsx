"use client";

import { useMemo, useState } from "react";
import { useChainData } from "@/components/shell/ChainDataProvider";
import { BlockTable } from "@/components/BlockTable";
import { TransactionTable, flattenTransactions } from "@/components/TransactionTable";
import { SearchBar } from "@/components/SearchBar";
import { Card, SectionHeading, Button, ErrorText } from "@/components/ui";

const PAGE_SIZE = 15;

export default function ExplorerPage() {
  const { chain, connected, error } = useChainData();
  const [blockPage, setBlockPage] = useState(1);
  const [txLimit, setTxLimit] = useState(PAGE_SIZE);

  const allBlocksDesc = useMemo(
    () => (chain ? [...chain.blocks].reverse() : []),
    [chain]
  );
  const visibleBlocks = allBlocksDesc.slice(0, blockPage * PAGE_SIZE);
  const hasMoreBlocks = visibleBlocks.length < allBlocksDesc.length;

  const transactions = useMemo(
    () => (chain ? flattenTransactions(chain.blocks, txLimit) : []),
    [chain, txLimit]
  );
  const totalTxCount = useMemo(
    () => (chain ? chain.blocks.reduce((n, b) => n + b.transactions.length, 0) : 0),
    [chain]
  );
  const hasMoreTxs = transactions.length < totalTxCount;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 max-w-4xl">
      <h1 className="font-sans text-2xl font-semibold tracking-tight mb-6">Explorer</h1>

      <SearchBar className="mb-8" />

      {error && connected === false && (
        <ErrorText>Can&apos;t reach the node ({error}). Is l1_node running?</ErrorText>
      )}

      <Card className="mb-6">
        <SectionHeading title="Latest Blocks" />
        <BlockTable blocks={visibleBlocks} />
        {hasMoreBlocks && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => setBlockPage((p) => p + 1)}>
              Load more
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeading title="Latest Transactions" />
        <TransactionTable txs={transactions} />
        {hasMoreTxs && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => setTxLimit((n) => n + PAGE_SIZE)}>
              Load more
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
