"use client";
import { AlertTriangle, Lock, X } from "lucide-react";

interface AlertBannerProps {
  onDismiss: () => void;
}

export function AlertBanner({ onDismiss }: AlertBannerProps) {
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
          DEV-****-XC54
        </code>
        <span className="text-foreground-muted">
          — Combustible crítico: autonomía estimada &lt; 1 hora · placa{" "}
          <b className="text-foreground">QYR-432</b> · conductor C. Restrepo
        </span>
      </div>
      <span className="hidden xl:inline-flex items-center gap-1 text-[9.5px] tracking-[0.16em] uppercase font-bold text-danger border border-danger/40 px-2 py-[3px] rounded-full bg-danger/[0.08] flex-shrink-0">
        <Lock size={9} />
        Admin only
      </span>
      <button className="hidden xl:inline-flex items-center gap-1.5 h-7 px-3 bg-accent text-bg text-[11px] font-semibold rounded-lg border-none cursor-pointer flex-shrink-0 hover:brightness-110">
        Asignar estación más cercana
      </button>
      <button
        onClick={onDismiss}
        className="text-foreground-muted border border-hairline px-2.5 py-1 rounded-[6px] font-sans text-[11px] cursor-pointer bg-transparent hover:text-foreground hover:border-hairline-strong flex-shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}
