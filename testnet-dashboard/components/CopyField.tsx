"use client";

import { useState } from "react";
import { IconCopy, IconCheck } from "./icons";

export function CopyField({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1.5">
        {label}
      </div>
      <button
        onClick={copy}
        className={`w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-left text-xs hover:border-accent transition-colors ${
          mono ? "font-mono" : "font-sans"
        }`}
      >
        <span className="break-all">{value}</span>
        {copied ? (
          <IconCheck width={15} height={15} className="text-success shrink-0" />
        ) : (
          <IconCopy width={15} height={15} className="text-muted shrink-0" />
        )}
      </button>
    </div>
  );
}
