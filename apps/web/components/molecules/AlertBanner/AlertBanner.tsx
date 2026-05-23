"use client";
import { AlertTriangle, Lock, X } from "lucide-react";
import type { Alert } from "@/types/alert.types";

interface AlertBannerProps {
  alert: Alert;
  onDismiss: () => void;
}

export function AlertBanner({ alert, onDismiss }: AlertBannerProps) {
  return (
    <div
      className="flex items-center gap-3.5 px-4 py-[11px] text-foreground text-[12.5px] flex-shrink-0 min-w-0 border-b border-danger/28"
      style={{ background: "linear-gradient(90deg, rgba(255,77,94,0.16), rgba(255,77,94,0.04))" }}
    >
      <div className="w-[26px] h-[26px] rounded-[7px] bg-danger-soft text-danger grid place-items-center flex-shrink-0 border border-danger/32">
        <AlertTriangle size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-semibold tracking-[-0.005em]">Vehículo</span>
        <code className="font-mono text-foreground bg-white/[0.06] border border-hairline px-1.5 py-[1px] rounded text-[11px] mx-1.5">
          {alert.vehicle_name}
        </code>
        <span className="text-foreground-muted">— {alert.message}</span>
      </div>
      <span className="hidden xl:inline-flex items-center gap-1 text-[9.5px] tracking-[0.16em] uppercase font-bold text-danger border border-danger/40 px-2 py-[3px] rounded-full bg-danger/[0.08] flex-shrink-0">
        <Lock size={9} />
        Admin only
      </span>
      <button
        onClick={onDismiss}
        className="text-foreground-muted border border-hairline px-2.5 py-1 rounded-[6px] font-sans text-[11px] cursor-pointer bg-transparent hover:text-foreground hover:border-hairline-strong flex-shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}
