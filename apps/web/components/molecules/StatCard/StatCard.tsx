import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendDir?: "up" | "down" | "neutral";
  accent?: boolean;
  danger?: boolean;
}

export function StatCard({ label, value, unit, trend, trendDir = "neutral", accent, danger }: StatCardProps) {
  return (
    <div className="bg-surface-1 border border-hairline rounded p-[10px_12px]">
      <div className="text-[9.5px] tracking-[0.12em] uppercase text-foreground-dim font-semibold mb-1.5">{label}</div>
      <div className={cn(
        "font-mono text-[22px] font-medium tracking-[-0.02em] leading-none",
        accent ? "text-accent" : danger ? "text-danger" : "text-foreground"
      )}>
        {value}
        {unit && <span className="text-[11px] text-foreground-muted ml-0.5 font-medium">{unit}</span>}
      </div>
      {trend && (
        <div className={cn(
          "mt-[5px] text-[10px] inline-flex items-center gap-1 font-mono",
          trendDir === "up" ? "text-success" : trendDir === "down" ? "text-danger" : "text-foreground-muted"
        )}>
          {trendDir === "up" && <TrendingUp size={9} />}
          {trendDir === "down" && <TrendingDown size={9} />}
          {trend}
        </div>
      )}
    </div>
  );
}
