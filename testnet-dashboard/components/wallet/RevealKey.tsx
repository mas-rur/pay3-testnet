"use client";

import { useState } from "react";
import { IconEye, IconEyeOff, IconCopy, IconCheck } from "@/components/icons";

export function RevealKey({ privateKey }: { privateKey: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(privateKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1.5">
        Private key
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5">
        <span className="flex-1 font-mono text-xs break-all">
          {visible ? privateKey : "•".repeat(48)}
        </span>
        <button
          aria-label={visible ? "Hide private key" : "Show private key"}
          onClick={() => setVisible((v) => !v)}
          className="text-muted hover:text-foreground shrink-0"
        >
          {visible ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
        </button>
        {visible && (
          <button
            aria-label="Copy private key"
            onClick={copy}
            className="text-muted hover:text-foreground shrink-0"
          >
            {copied ? (
              <IconCheck width={16} height={16} className="text-success" />
            ) : (
              <IconCopy width={16} height={16} />
            )}
          </button>
        )}
      </div>
      <p className="font-mono text-[11px] text-danger mt-1.5">
        Anyone with this key can spend from this address. Never share it.
      </p>
    </div>
  );
}
