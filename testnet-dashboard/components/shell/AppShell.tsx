import type { ReactNode } from "react";
import { DesktopSidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ChainDataProvider } from "./ChainDataProvider";
import { RPC_URL } from "@/lib/rpc";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ChainDataProvider>
      <div className="flex min-h-full">
        <DesktopSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border px-4 py-4 md:px-8">
            <p className="font-mono text-[11px] text-muted truncate">
              Connected to {RPC_URL}
            </p>
          </footer>
        </div>
      </div>
    </ChainDataProvider>
  );
}
