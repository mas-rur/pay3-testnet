"use client";

import { useState } from "react";
import { CHAIN_SHORT_NAME } from "@/lib/chain-config";

/**
 * Drop your logo file at `public/logo.png` and it'll show up here
 * automatically. Until then (or if it fails to load) this falls back to a
 * simple accent-colored badge so the layout never breaks.
 */
export function Logo({ size = 28 }: { size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="flex items-center justify-center rounded-lg bg-accent font-sans text-sm font-bold text-accent-ink"
        style={{ width: size, height: size }}
      >
        {CHAIN_SHORT_NAME.slice(0, 1)}
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- local static file, no need for next/image here
  return (
    <img
      src="/logo.png"
      alt={CHAIN_SHORT_NAME}
      width={size}
      height={size}
      className="rounded-lg object-contain"
      onError={() => setFailed(true)}
    />
  );
}
