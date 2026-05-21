import { cn } from "@/lib/cn";

type DotVariant = "ok" | "warn" | "danger" | "dim";

interface StatusDotProps {
  variant?: DotVariant;
  pulse?: boolean;
  size?: "sm" | "md";
}

const colors: Record<DotVariant, string> = {
  ok:     "bg-success  shadow-[0_0_0_3px_rgba(43,214,123,0.18)]",
  warn:   "bg-warning  shadow-[0_0_0_3px_rgba(255,181,71,0.18)]",
  danger: "bg-danger   shadow-[0_0_0_3px_rgba(255,77,94,0.18)]",
  dim:    "bg-foreground-dim",
};

export function StatusDot({ variant = "ok", pulse = false, size = "md" }: StatusDotProps) {
  const dim = size === "sm" ? "w-1.5 h-1.5" : "w-[7px] h-[7px]";
  return (
    <span className={cn("relative inline-block rounded-full flex-shrink-0", dim, colors[variant])}>
      {pulse && (
        <span
          className={cn("absolute inset-[-1px] rounded-full opacity-50", colors[variant])}
          style={{ animation: "pulse-ring 2s infinite ease-out" }}
        />
      )}
    </span>
  );
}
