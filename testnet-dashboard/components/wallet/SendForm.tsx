"use client";

import { useState } from "react";
import { Label, Input, Button, ErrorText } from "@/components/ui";
import { rpc } from "@/lib/rpc";
import { signTransfer } from "@/lib/wallet";
import { isValidAddress } from "@/lib/format";

export function SendForm({
  fromAddress,
  privateKey,
  onSent,
}: {
  fromAddress: string;
  privateKey: string;
  onSent: () => void;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const account = await rpc.account(fromAddress);
      const tx = signTransfer(privateKey, to.trim(), BigInt(amount), BigInt(account.nonce));
      const res = await rpc.sendTx(tx);
      setResult(`Sent. tx_hash: ${res.tx_hash}`);
      setTo("");
      setAmount("");
      onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "send failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>To address</Label>
        <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x..." />
      </div>
      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1000"
        />
      </div>
      <Button
        onClick={send}
        disabled={!isValidAddress(to) || !amount || Number(amount) <= 0 || loading}
        className="w-full"
      >
        {loading ? "Signing & submitting..." : "Sign & send"}
      </Button>
      {error && <ErrorText>{error}</ErrorText>}
      {result && <p className="font-mono text-xs text-success mt-1 break-all">{result}</p>}
    </div>
  );
}
