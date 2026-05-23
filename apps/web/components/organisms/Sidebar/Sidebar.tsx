"use client";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Map, AlertTriangle, BarChart2, type LucideIcon } from "lucide-react";
import { NavItem } from "@/components/molecules/NavItem";
import { ConnectionLine } from "@/components/molecules/ConnectionLine";
import { useAuthStore } from "@/stores/auth.store";
import { useAlertsStore } from "@/stores/alerts.store";
import { useConnectivityStore } from "@/stores/connectivity.store";

type NavId = "dashboard" | "vehicles" | "alerts" | "reports";

const navItems: { id: NavId; label: string; icon: LucideIcon; href: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: Map,             href: "/dashboard" },
  { id: "vehicles",  label: "Vehículos", icon: LayoutDashboard, href: "/vehicles" },
  { id: "alerts",    label: "Alertas",   icon: AlertTriangle,   href: "/alerts" },
  { id: "reports",   label: "Reportes",  icon: BarChart2,       href: "/reports" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const unresolvedCount = useAlertsStore((s) => s.unresolvedCount);
  const { isOnline, wsStatus } = useConnectivityStore();

  const visibleItems = navItems.filter(
    (item) => item.id !== "alerts" || role === "admin"
  );

  return (
    <aside className="flex flex-col gap-1 bg-bg border-r border-hairline px-3 py-4 min-h-0 overflow-y-auto flex-shrink-0 w-[232px]">
      <span className="text-[9.5px] tracking-[0.16em] text-foreground-dim uppercase font-semibold px-2.5 py-3 pt-0">
        Principal
      </span>
      {visibleItems.map((item) => (
        <NavItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          count={item.id === "alerts" && unresolvedCount > 0 ? unresolvedCount : undefined}
          active={pathname.startsWith(item.href)}
          alert={item.id === "alerts" && unresolvedCount > 0}
          onClick={() => router.push(item.href)}
        />
      ))}

      <div className="mt-auto pt-3 pb-3 border-t border-hairline flex flex-col gap-2.5">
        <ConnectionLine label="WebSocket" value={!isOnline ? "Offline" : "Conectado"} status={!isOnline ? "off" : "ok"} />
        <ConnectionLine label="Estado WS" value={wsStatus} status={wsStatus === "LIVE" ? "ok" : "warn"} />
        <ConnectionLine label="Modo" value={!isOnline ? "Offline (caché)" : "Online"} status={!isOnline ? "warn" : "ok"} />
      </div>
    </aside>
  );
}
