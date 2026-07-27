"use client";

import { useState } from "react";
import { rpc, type Account } from "@/lib/rpc";
import { Card, Label, Input, Button, ErrorText } from "./ui";

export function BalancePanel({ initialAddress = "" }: { initialAddress?: string }) {
  const [address, setAddress] = useState(initialAddress);
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup() {
    setLoading(true);
    setError(null);
    setAccount(null);
    try {
      const acct = await rpc.account(address.trim());
      setAccount(acct);
    } catch (e) {
      setError(e instanceof Error ? e.message : "lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="font-sans text-lg mb-4">Balance</h2>
      <Label>Address</Label>
      <div className="flex gap-3">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          onKeyDown={(e) => e.key === "Enter" && lookup()}
        />
        <Button onClick={lookup} disabled={!address || loading}>
          {loading ? "..." : "Check"}
        </Button>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {account && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1">
              Balance
            </div>
            <div className="font-mono text-2xl text-accent">{account.balance}</div>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1">
              Nonce
            </div>
            <div className="font-mono text-2xl">{account.nonce}</div>
          </div>
        </div>
      )}
    </Card>
  );
}
