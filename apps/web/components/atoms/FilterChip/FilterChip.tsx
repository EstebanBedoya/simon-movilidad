"use client";
import { cn } from "@/lib/cn";

interface FilterChipProps {
  label: string;
  dot?: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

export function FilterChip({ label, dot, count, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] cursor-pointer transition-all duration-150 font-sans",
        active
          ? "bg-surface-2 text-foreground border-hairline-strong"
          : "bg-transparent text-foreground-muted border-hairline hover:border-hairline-strong hover:text-foreground"
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
      )}
      {label}
      {count !== undefined && (
        <span className="text-foreground-dim font-mono ml-0.5">{count}</span>
      )}
    </button>
  );
}
