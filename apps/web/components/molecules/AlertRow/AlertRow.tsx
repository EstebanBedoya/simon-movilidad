import { AlertTriangle, Fuel, Thermometer, Wifi } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Alert, AlertType } from "@/types/alert.types";

interface AlertRowProps {
  alert: Alert;
  onResolve?: (id: string) => void;
}

const icons: Record<AlertType, React.ElementType> = {
  low_fuel:        Fuel,
  high_temperature: Thermometer,
  speeding:        AlertTriangle,
  offline:         Wifi,
};

const styles: Record<AlertType, string> = {
  low_fuel:        "bg-warning-soft text-warning border-warning/24",
  high_temperature: "bg-danger-soft text-danger border-danger/32",
  speeding:        "bg-warning-soft text-warning border-warning/24",
  offline:         "bg-surface-3 text-foreground-dim border-hairline",
};

const iconBg: Record<AlertType, string> = {
  low_fuel:        "bg-warning-soft text-warning",
  high_temperature: "bg-danger-soft text-danger",
  speeding:        "bg-warning-soft text-warning",
  offline:         "bg-surface-3 text-foreground-dim",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)} h`
}

export function AlertRow({ alert: a, onResolve }: AlertRowProps) {
  const Icon = icons[a.type] ?? AlertTriangle;

  return (
    <div
      className={cn(
        "grid gap-2.5 p-2.5 rounded border transition-colors duration-150",
        styles[a.type],
        !a.resolved && "cursor-pointer hover:opacity-90"
      )}
      style={{ gridTemplateColumns: "28px 1fr auto" }}
    >
      <div className={cn("w-7 h-7 rounded-[7px] grid place-items-center flex-shrink-0", iconBg[a.type])}>
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <div className="text-[11.5px] font-medium text-foreground truncate">{a.message}</div>
        <div className="flex items-center gap-1.5 text-[10.5px] text-foreground-muted font-mono mt-0.5">
          <span>{a.vehicle_name}</span>
          <span className="text-foreground-dim">·</span>
          <span>{a.type.replace("_", " ")}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] text-foreground-dim font-mono whitespace-nowrap">{timeAgo(a.created_at)}</span>
        {!a.resolved && onResolve && (
          <button
            onClick={() => onResolve(a.id)}
            className="text-[9.5px] text-accent font-medium hover:underline"
          >
            Resolver
          </button>
        )}
      </div>
    </div>
  );
}
