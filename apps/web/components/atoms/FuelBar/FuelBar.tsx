import { cn } from "@/lib/cn";

interface FuelBarProps {
  value: number;
}

export function FuelBar({ value }: FuelBarProps) {
  const level = value < 15 ? "danger" : value < 35 ? "warn" : "ok";
  const fillColor = level === "danger" ? "bg-danger" : level === "warn" ? "bg-warning" : "bg-accent";
  return (
    <div className="h-[3px] bg-surface-3 rounded-sm overflow-hidden mt-0.5">
      <div
        className={cn("h-full rounded-sm transition-[width] duration-700 ease-out", fillColor)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
