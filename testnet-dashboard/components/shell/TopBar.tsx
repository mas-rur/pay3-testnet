"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { IconMenu } from "@/components/icons";
import { Dot } from "@/components/ui";
import { useChainData } from "./ChainDataProvider";
import { MobileDrawer } from "./Sidebar";
import { CHAIN_SHORT_NAME } from "@/lib/chain-config";
import Link from "next/link";

export function TopBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { connected, chain } = useChainData();

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3.5 md:px-8 md:py-4">
        <Link href="/" className="flex items-center gap-2.5 md:hidden">
          <Logo size={26} />
          <span className="font-sans text-[15px] font-semibold tracking-tight">
            {CHAIN_SHORT_NAME}
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted">
            <Dot tone={connected === null ? "neutral" : connected ? "success" : "danger"} />
            {connected === null ? "Connecting" : connected ? "Live" : "Offline"}
            {chain && connected && (
              <span className="text-foreground">· {chain.height.toLocaleString()} blocks</span>
            )}
          </span>

          <button
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-surface md:hidden"
          >
            <IconMenu />
          </button>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
