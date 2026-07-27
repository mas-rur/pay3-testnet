"use client";

import { useState } from "react";
import { createWallet } from "@/lib/wallet";
import { Card, Button } from "./ui";

export function NewWalletPanel() {
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(
    null
  );
  const [copied, setCopied] = useState<string | null>(null);

  function copy(label: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <Card>
      <h2 className="font-sans text-lg mb-1">New wallet</h2>
      <p className="font-mono text-[11px] text-muted mb-5">
        Generated locally in your browser. Nothing is sent anywhere until you sign
        and submit a transaction with it.
      </p>

      <Button onClick={() => setWallet(createWallet())} variant="ghost">
        Generate
      </Button>

      {wallet && (
        <div className="mt-5 space-y-3">
          <Field label="Address" value={wallet.address} onCopy={copy} copied={copied} />
          <Field
            label="Private key"
            value={wallet.privateKey}
            onCopy={copy}
            copied={copied}
          />
        </div>
      )}
    </Card>
  );
}

function Field({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: (label: string, value: string) => void;
  copied: string | null;
}) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1">
        {label}
      </div>
      <button
        onClick={() => onCopy(label, value)}
        className="w-full text-left border border-border bg-background px-3 py-2.5 font-mono text-xs break-all hover:border-accent transition-colors"
      >
        {value}
      </button>
      {copied === label && (
        <div className="font-mono text-[11px] text-accent mt-1">copied</div>
      )}
    </div>
  );
}
