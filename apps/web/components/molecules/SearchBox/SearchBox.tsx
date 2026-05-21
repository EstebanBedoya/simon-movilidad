"use client";
import { Search } from "lucide-react";

export function SearchBox() {
  return (
    <div className="flex-1 max-w-[320px] min-w-[120px] bg-surface-1 border border-hairline rounded flex items-center px-3 h-8 gap-2 text-foreground-muted">
      <Search size={14} />
      <input
        className="bg-transparent border-none outline-none text-foreground font-sans text-[13px] flex-1 placeholder:text-foreground-muted"
        placeholder="Buscar vehículo, placa o dispositivo…"
      />
      <kbd className="font-mono text-[10px] bg-surface-3 border border-hairline px-1.5 py-0.5 rounded text-foreground-dim hidden lg:block">
        ⌘K
      </kbd>
    </div>
  );
}
