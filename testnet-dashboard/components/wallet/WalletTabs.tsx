"use client";

import type { StoredWallet } from "@/lib/wallet";
import { shortenAddress } from "@/lib/format";
import { IconPlus } from "@/components/icons";

export function WalletTabs({
  wallets,
  activeAddress,
  onSelect,
  onAdd,
}: {
  wallets: StoredWallet[];
  activeAddress: string | null;
  onSelect: (address: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
      {wallets.map((w) => {
        const active = w.address.toLowerCase() === activeAddress?.toLowerCase();
        return (
          <button
            key={w.address}
            onClick={() => onSelect(w.address)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-accent-ink"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {w.label}
            <span className="ml-2 font-mono text-[11px] opacity-70">
              {shortenAddress(w.address, 3)}
            </span>
          </button>
        );
      })}
      <button
        onClick={onAdd}
        aria-label="Add wallet"
        className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted hover:text-foreground"
      >
        <IconPlus width={16} height={16} />
      </button>
    </div>
  );
}
