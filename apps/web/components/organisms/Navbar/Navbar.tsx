"use client";
import { Bell, HelpCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { NavBrand } from "@/components/molecules/NavBrand";
import { SearchBox } from "@/components/molecules/SearchBox";
import { RoleBadge } from "@/components/molecules/RoleBadge";
import { StatusDot } from "@/components/atoms/StatusDot";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { useAuthStore } from "@/stores/auth.store";
import { useAlertsStore } from "@/stores/alerts.store";
import { useConnectivityStore } from "@/stores/connectivity.store";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unresolvedCount = useAlertsStore((s) => s.unresolvedCount);
  const { isOnline, wsStatus } = useConnectivityStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="flex items-center px-4 bg-bg z-10 min-w-0 overflow-hidden h-[56px] flex-shrink-0">
      <NavBrand />

      {/* Center */}
      <div className="flex-1 flex items-center gap-3.5 min-w-0 overflow-hidden">
        <div className="hidden md:flex items-center gap-2.5 text-[12px] text-foreground-muted whitespace-nowrap overflow-hidden">
          <b className="text-foreground font-semibold">Simón Movilidad</b>
          <span className="text-foreground-dim">/</span>
          <span>Operaciones</span>
        </div>
        <SearchBox />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5 flex-shrink-0 ml-2.5">
        <div
          className="hidden lg:inline-flex items-center gap-[7px] h-7 px-[10px_9px] bg-surface-1 border border-hairline rounded-full text-[11px] text-foreground-muted font-mono tracking-[0.02em]"
          title="Estado WebSocket"
        >
          <StatusDot variant={!isOnline ? "warn" : "ok"} pulse />
          <span>WS</span>
          <b className="text-foreground font-medium">
            {!isOnline ? "OFFLINE" : wsStatus}
          </b>
        </div>

        {user?.role === "admin" && (
          <Button variant="icon" title="Notificaciones">
            <Bell size={15} />
            {unresolvedCount > 0 && <Badge count={unresolvedCount} />}
          </Button>
        )}

        <Button variant="icon" title="Ayuda">
          <HelpCircle size={15} />
        </Button>

        <RoleBadge
          role={user?.role === "admin" ? "Admin" : "User"}
          name={user?.email ?? ""}
          sub="Operaciones"
          initials={initials}
        />

        <Button variant="icon" title="Sign out" onClick={handleLogout}>
          <LogOut size={15} />
        </Button>
      </div>
    </header>
  );
}
