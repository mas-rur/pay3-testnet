"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { Logo } from "@/components/Logo";
import { IconClose, IconChevronLeft } from "@/components/icons";
import { CHAIN_NAME } from "@/lib/chain-config";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-surface text-foreground"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            <Icon
              className={active ? "text-foreground" : "text-muted"}
              width={19}
              height={19}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Persistent left sidebar, visible from the md breakpoint up. */
export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-border md:px-4 md:py-6">
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-8">
        <Logo />
        <span className="font-sans text-[15px] font-semibold tracking-tight">
          {CHAIN_NAME}
        </span>
      </Link>
      <NavList />
    </aside>
  );
}

/** Slide-out drawer for mobile, opened from the TopBar hamburger. */
export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-background px-4 py-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between px-1">
          <Logo />
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
          >
            <IconClose width={18} height={18} />
          </button>
        </div>
        <div className="relative flex items-center justify-center mb-6 px-1">
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
          >
            <IconChevronLeft width={18} height={18} />
          </button>
          <span className="font-sans text-[15px] font-semibold tracking-tight">
            {CHAIN_NAME}
          </span>
        </div>
        <NavList onNavigate={onClose} />
      </div>
    </div>
  );
}
