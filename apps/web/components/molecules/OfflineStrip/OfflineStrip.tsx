"use client";
import { WifiOff } from "lucide-react";

export function OfflineStrip() {
  return (
    <div className="bg-warning-soft border border-warning/28 rounded p-[10px_12px] flex items-center gap-2.5 text-[11px] text-warning">
      <WifiOff size={14} />
      <div className="flex-1">
        <div className="font-semibold">Modo offline</div>
        <div className="text-foreground-muted text-[10.5px] font-mono">Datos en caché · últ. sync hace 38 s</div>
      </div>
      <button className="h-[26px] px-2.5 text-[11px] bg-surface-1 border border-hairline rounded text-foreground cursor-pointer hover:bg-surface-2 font-sans">
        Reintentar
      </button>
    </div>
  );
}
