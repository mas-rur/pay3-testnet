"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { rpc, type ChainResponse } from "@/lib/rpc";

interface ChainDataValue {
  chain: ChainResponse | null;
  connected: boolean | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const ChainDataContext = createContext<ChainDataValue | null>(null);

export function ChainDataProvider({ children }: { children: ReactNode }) {
  const [chain, setChain] = useState<ChainResponse | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await rpc.chain();
      setChain(res);
      setConnected(true);
      setError(null);
    } catch (e) {
      setConnected(false);
      setError(e instanceof Error ? e.message : "request failed");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      if (cancelled) return;
      await refresh();
    }
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refresh]);

  return (
    <ChainDataContext.Provider value={{ chain, connected, error, refresh }}>
      {children}
    </ChainDataContext.Provider>
  );
}

export function useChainData() {
  const ctx = useContext(ChainDataContext);
  if (!ctx) {
    throw new Error("useChainData must be used within a ChainDataProvider");
  }
  return ctx;
}
