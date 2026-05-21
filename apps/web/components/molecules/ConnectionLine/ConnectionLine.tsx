import { cn } from "@/lib/cn";

interface ConnectionLineProps {
  label: string;
  value: string;
  status: "ok" | "warn" | "off";
}

const dotColors: Record<string, string> = {
  ok:  "bg-success shadow-[0_0_6px_var(--success)]",
  warn: "bg-warning",
  off: "bg-danger",
};

export function ConnectionLine({ label, value, status }: ConnectionLineProps) {
  return (
    <div className="flex items-center justify-between text-[10.5px] text-foreground-muted font-mono">
      <span className="tracking-[0.02em]">{label}</span>
      <span className="inline-flex items-center gap-[5px] text-foreground">
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[status])} />
        {value}
      </span>
    </div>
  );
}
