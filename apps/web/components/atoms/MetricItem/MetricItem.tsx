import { cn } from "@/lib/cn";
import { ReactNode } from "react";

interface MetricItemProps {
  label: string;
  value: ReactNode;
  unit?: string;
  state?: "ok" | "warn" | "danger";
  children?: ReactNode;
}

const stateColor: Record<string, string> = {
  ok:     "text-foreground",
  warn:   "text-warning",
  danger: "text-danger",
};

export function MetricItem({ label, value, unit, state = "ok", children }: MetricItemProps) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-[9px] tracking-[0.12em] text-foreground-dim uppercase font-semibold">
        {label}
      </span>
      <span className={cn("font-mono text-[13px] font-medium leading-none flex items-baseline gap-[3px]", stateColor[state])}>
        {value}
        {unit && <span className="text-[9.5px] font-medium text-foreground-dim">{unit}</span>}
      </span>
      {children}
    </div>
  );
}
