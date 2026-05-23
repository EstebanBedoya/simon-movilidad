"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useConnectivityStore } from "@/stores/connectivity.store";

function useElapsed(from: number | null): string {
  const [label, setLabel] = useState("–");

  useEffect(() => {
    if (from === null) return;

    function update() {
      const secs = Math.floor((Date.now() - from!) / 1000);
      if (secs < 60) setLabel(`${secs} s`);
      else setLabel(`${Math.floor(secs / 60)} min`);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [from]);

  return label;
}

interface OfflineStripProps {
  onRetry?: () => void;
}

export function OfflineStrip({ onRetry }: OfflineStripProps) {
  const lastSyncAt = useConnectivityStore((s) => s.lastSyncAt);
  const elapsed = useElapsed(lastSyncAt);

  return (
    <div className="bg-warning-soft border border-warning/28 rounded p-[10px_12px] flex items-center gap-2.5 text-[11px] text-warning">
      <WifiOff size={14} />
      <div className="flex-1">
        <div className="font-semibold">Modo offline</div>
        <div className="text-foreground-muted text-[10.5px] font-mono">
          {lastSyncAt ? `Datos en caché · últ. sync hace ${elapsed}` : "Datos en caché · sin sincronización"}
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-[26px] px-2.5 text-[11px] bg-surface-1 border border-hairline rounded text-foreground cursor-pointer hover:bg-surface-2 font-sans"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
