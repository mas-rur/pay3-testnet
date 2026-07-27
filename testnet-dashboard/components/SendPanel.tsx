"use client";

import { useState } from "react";
import { rpc } from "@/lib/rpc";
import { addressFromPublicKey, signTransfer } from "@/lib/wallet";
import { SigningKey } from "ethers";
import { Card, Label, Input, Button, ErrorText } from "./ui";

export function SendPanel() {
  const [privateKey, setPrivateKey] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const signingKey = new SigningKey(privateKey.trim());
      const from = addressFromPublicKey(signingKey.publicKey);

      const account = await rpc.account(from);
      const tx = signTransfer(
        privateKey.trim(),
        to.trim(),
        BigInt(amount),
        BigInt(account.nonce)
      );

      const res = await rpc.sendTx(tx);
      setResult(`Sent. tx_hash: ${res.tx_hash}`);
      setAmount("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "send failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="font-sans text-lg mb-1">Send</h2>
      <p className="font-mono text-[11px] text-muted mb-5">
        Signs entirely in your browser -- the key never leaves this tab. Testnet
        only: never paste a mainnet or otherwise real private key here.
      </p>

      <div className="space-y-4">
        <div>
          <Label>Private key</Label>
          <Input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="0x..."
          />
        </div>
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
          disabled={!privateKey || !to || !amount || loading}
          className="w-full"
        >
          {loading ? "Signing & submitting..." : "Sign & send"}
        </Button>
      </div>

      {error && <ErrorText>{error}</ErrorText>}
      {result && <p className="font-mono text-xs text-accent mt-3 break-all">{result}</p>}
    </Card>
  );
}
