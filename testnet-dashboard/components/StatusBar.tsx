"use client";

import { useEffect, useState } from "react";
import { rpc, RPC_URL } from "@/lib/rpc";

export function StatusBar() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [latestHash, setLatestHash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        await rpc.health();
        const chain = await rpc.chain();
        if (cancelled) return;
        setConnected(true);
        setHeight(chain.height);
        setLatestHash(chain.blocks[chain.blocks.length - 1]?.hash ?? null);
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-border px-6 py-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            connected === null
              ? "bg-muted"
              : connected
                ? "bg-accent shadow-[0_0_8px_var(--accent)]"
                : "bg-danger"
          }`}
        />
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {connected === null ? "connecting" : connected ? "live" : "offline"}
        </span>
      </div>

      <div className="font-mono text-xs text-muted">
        <span className="text-foreground">{height ?? "—"}</span> blocks
      </div>

      {latestHash && (
        <div className="font-mono text-xs text-muted truncate">
          latest {latestHash.slice(0, 14)}...
        </div>
      )}

      <div className="ml-auto font-mono text-[11px] text-muted truncate max-w-[40vw]">
        {RPC_URL}
      </div>
    </div>
  );
}
