"use client";
import { ReactNode } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { Sidebar } from "@/components/organisms/Sidebar";
import { OfflineStrip } from "@/components/molecules/OfflineStrip";
import { useConnectivityStore } from "@/stores/connectivity.store";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isOnline = useConnectivityStore((s) => s.isOnline);

  return (
    <div className="grid h-full overflow-hidden" style={{ gridTemplateRows: "56px 1fr" }}>
      <Navbar />
      <div className="grid min-h-0 min-w-0 border-t border-hairline overflow-hidden" style={{ gridTemplateColumns: "232px minmax(0,1fr)" }}>
        <Sidebar />
        <div className="flex flex-col min-h-0 min-w-0 overflow-hidden">
          {!isOnline && <OfflineStrip />}
          <main className="flex-1 min-h-0 min-w-0 overflow-hidden bg-surface-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
