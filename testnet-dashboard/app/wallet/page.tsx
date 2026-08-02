"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listWallets,
  getActiveWalletAddress,
  setActiveWalletAddress,
  removeWallet,
  renameWallet,
  type StoredWallet,
} from "@/lib/wallet";
import { rpc, type Account, type HistoryEvent } from "@/lib/rpc";
import { Card, Panel, Button, ErrorText, SectionHeading } from "@/components/ui";
import { CopyField } from "@/components/CopyField";
import { RevealKey } from "@/components/wallet/RevealKey";
import { SendForm } from "@/components/wallet/SendForm";
import { WalletTabs } from "@/components/wallet/WalletTabs";
import { CreateImportPanel } from "@/components/wallet/CreateImportPanel";
import { formatNumber, timeAgo } from "@/lib/format";
import { TOKEN_SYMBOL } from "@/lib/chain-config";
import { IconArrowDownLeft, IconArrowUpRight, IconRefresh, IconTrash } from "@/components/icons";

export default function WalletPage() {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [activeAddress, setActiveAddress] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [history, setHistory] = useState<HistoryEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
  const [mounted, setMounted] = useState(false);

  const reloadWallets = useCallback(() => {
    setWallets(listWallets());
    setActiveAddress(getActiveWalletAddress());
  }, []);

  useEffect(() => {
    reloadWallets();
    setMounted(true);
  }, [reloadWallets]);

  const active = wallets.find(
    (w) => w.address.toLowerCase() === activeAddress?.toLowerCase()
  );

  const refreshAccount = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    setError(null);
    try {
      const [acct, hist] = await Promise.all([
        rpc.account(active.address),
        rpc.history(active.address),
      ]);
      setAccount(acct);
      setHistory(hist.history);
    } catch (e) {
      setError(e instanceof Error ? e.message : "lookup failed");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.address]);

  useEffect(() => {
    setAccount(null);
    setHistory(null);
    if (active) refreshAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.address]);

  function selectWallet(address: string) {
    setActiveWalletAddress(address);
    setActiveAddress(address);
    setShowAdd(false);
  }

  function handleRemove() {
    if (!active) return;
    if (!confirm(`Remove "${active.label}" from this device? This cannot be undone.`)) {
      return;
    }
    removeWallet(active.address);
    reloadWallets();
  }

  function saveLabel() {
    if (!active || !labelDraft.trim()) {
      setRenaming(false);
      return;
    }
    renameWallet(active.address, labelDraft.trim());
    reloadWallets();
    setRenaming(false);
  }

  // Avoid a hydration mismatch: localStorage is only readable client-side.
  if (!mounted) {
    return <div className="px-4 py-8 sm:px-8 sm:py-10 max-w-2xl" />;
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 max-w-2xl">
      <h1 className="font-sans text-2xl font-semibold tracking-tight mb-6">Wallet</h1>

      {wallets.length === 0 || showAdd ? (
        <>
          {wallets.length > 0 && (
            <button
              onClick={() => setShowAdd(false)}
              className="font-mono text-[11px] uppercase tracking-widest text-muted hover:text-foreground mb-4"
            >
              &larr; Back to wallets
            </button>
          )}
          <CreateImportPanel
            onDone={() => {
              reloadWallets();
              setShowAdd(false);
            }}
          />
        </>
      ) : (
        <>
          <WalletTabs
            wallets={wallets}
            activeAddress={activeAddress}
            onSelect={selectWallet}
            onAdd={() => setShowAdd(true)}
          />

          {active && (
            <div className="space-y-6">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  {renaming ? (
                    <input
                      autoFocus
                      value={labelDraft}
                      onChange={(e) => setLabelDraft(e.target.value)}
                      onBlur={saveLabel}
                      onKeyDown={(e) => e.key === "Enter" && saveLabel()}
                      className="font-sans text-base font-semibold bg-transparent border-b border-accent outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setLabelDraft(active.label);
                        setRenaming(true);
                      }}
                      className="font-sans text-base font-semibold hover:text-accent-link text-left"
                    >
                      {active.label}
                    </button>
                  )}
                  <button
                    aria-label="Refresh balance"
                    onClick={refreshAccount}
                    disabled={loading}
                    className="text-muted hover:text-foreground disabled:opacity-40"
                  >
                    <IconRefresh width={16} height={16} />
                  </button>
                </div>

                <CopyField label="Address" value={active.address} />

                <div className="grid grid-cols-2 gap-3">
                  <Panel>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1">
                      Balance
                    </div>
                    <div className="font-sans text-xl font-semibold tabular-nums">
                      {account ? `${formatNumber(account.balance)} ${TOKEN_SYMBOL}` : "—"}
                    </div>
                  </Panel>
                  <Panel>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1">
                      Nonce
                    </div>
                    <div className="font-sans text-xl font-semibold tabular-nums">
                      {account ? account.nonce : "—"}
                    </div>
                  </Panel>
                </div>

                {error && <ErrorText>{error}</ErrorText>}

                <RevealKey privateKey={active.privateKey} />

                <div className="pt-1">
                  <Button variant="outline" onClick={handleRemove} className="text-danger">
                    <IconTrash width={15} height={15} />
                    Remove from this device
                  </Button>
                </div>
              </Card>

              <Card>
                <SectionHeading title="Send" />
                <SendForm
                  fromAddress={active.address}
                  privateKey={active.privateKey}
                  onSent={refreshAccount}
                />
              </Card>

              <Card>
                <SectionHeading title="Transaction history" />
                {history && history.length === 0 && (
                  <p className="font-mono text-xs text-muted py-2">No transactions yet.</p>
                )}
                {history && history.length > 0 && (
                  <div className="divide-y divide-border">
                    {history.map((e) => (
                      <div key={e.tx_hash} className="py-3 flex items-center gap-3 text-sm">
                        {e.direction === "sent" ? (
                          <IconArrowUpRight width={16} height={16} className="text-danger shrink-0" />
                        ) : (
                          <IconArrowDownLeft width={16} height={16} className="text-success shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="font-mono text-xs block truncate">
                            {e.direction === "sent" ? "To " : "From "}
                            {e.counterparty}
                          </span>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
