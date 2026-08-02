"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconExplorer } from "./icons";
import { isValidAddress } from "@/lib/format";

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function go() {
    const q = value.trim();
    if (!q) return;
    setError(null);

    if (/^\d+$/.test(q)) {
      router.push(`/explorer/block/${q}`);
      return;
    }
    if (isValidAddress(q)) {
      router.push(`/explorer/address/${q}`);
      return;
    }
    setError("Enter a block number or a 0x... address");
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-3 focus-within:border-accent transition-colors">
        <IconExplorer width={17} height={17} className="text-muted shrink-0" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Search block # or address"
          className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted/70"
        />
      </div>
      {error && <p className="font-mono text-xs text-danger mt-2">{error}</p>}
    </div>
  );
}
