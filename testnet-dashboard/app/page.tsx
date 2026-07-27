"use client";

import { useState } from "react";
import { StatusBar } from "@/components/StatusBar";
import { BalancePanel } from "@/components/BalancePanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { SendPanel } from "@/components/SendPanel";
import { NewWalletPanel } from "@/components/NewWalletPanel";

const TABS = ["Balance", "History", "Send", "New wallet"] as const;
type Tab = (typeof TABS)[number];

export default function Home() {
  const [tab, setTab] = useState<Tab>("Balance");

  return (
    <main className="flex-1 flex flex-col">
      <div className="px-6 pt-8 pb-2">
        <h1 className="font-sans text-2xl tracking-tight">
          Testnet <span className="text-accent">Explorer</span>
        </h1>
      </div>

      <StatusBar />

      <div className="flex gap-1 px-6 pt-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-mono text-xs uppercase tracking-widest px-4 py-3 border-b-2 transition-colors ${
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-2xl w-full px-6 py-10">
        {tab === "Balance" && <BalancePanel />}
        {tab === "History" && <HistoryPanel />}
        {tab === "Send" && <SendPanel />}
        {tab === "New wallet" && <NewWalletPanel />}
      </div>
    </main>
  );
}
