"use client";

import { useState } from "react";
import { rpc, type HistoryEvent } from "@/lib/rpc";
import { Card, Label, Input, Button, ErrorText } from "./ui";

export function HistoryPanel({ initialAddress = "" }: { initialAddress?: string }) {
  const [address, setAddress] = useState(initialAddress);
  const [events, setEvents] = useState<HistoryEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup() {
    setLoading(true);
    setError(null);
    setEvents(null);
    try {
      const res = await rpc.history(address.trim());
      setEvents(res.history);
    } catch (e) {
      setError(e instanceof Error ? e.message : "lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="font-sans text-lg mb-4">Transaction history</h2>
      <Label>Address</Label>
      <div className="flex gap-3">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          onKeyDown={(e) => e.key === "Enter" && lookup()}
        />
        <Button onClick={lookup} disabled={!address || loading}>
          {loading ? "..." : "Look up"}
        </Button>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {events && events.length === 0 && (
        <p className="mt-6 font-mono text-xs text-muted">No transactions yet.</p>
      )}

      {events && events.length > 0 && (
        <div className="mt-6 divide-y divide-border border-t border-border">
          {events.map((e) => (
            <div
              key={e.tx_hash}
              className="flex items-center justify-between gap-4 py-3 font-mono text-xs"
            >
              <span className="text-muted w-14 shrink-0">#{e.block}</span>
              <span
                className={`w-20 shrink-0 ${
                  e.direction === "sent" ? "text-danger" : "text-accent"
                }`}
              >
                {e.direction === "sent" ? "-> sent" : "<- recv"}
              </span>
              <span className="w-24 shrink-0 text-right">{e.amount}</span>
              <span className="text-muted truncate flex-1">{e.counterparty}</span>
              <span className="text-muted shrink-0 hidden sm:inline">
                {e.tx_hash.slice(0, 10)}...
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
