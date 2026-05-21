import { cn } from "@/lib/cn";
import type { UIVehicleStatus } from "@/types/fleet";

interface VehicleStatusBadgeProps {
  status: UIVehicleStatus;
}

const labels: Record<UIVehicleStatus, string> = {
  active:  "En ruta",
  idle:    "Detenido",
  alert:   "Alerta",
  offline: "Sin señal",
};

const styles: Record<UIVehicleStatus, string> = {
  active:  "bg-accent-soft text-accent",
  idle:    "bg-warning-soft text-warning",
  alert:   "bg-danger-soft text-danger",
  offline: "bg-surface-3 text-foreground-dim",
};

export function VehicleStatusBadge({ status }: VehicleStatusBadgeProps) {
  return (
    <span className={cn("text-[9.5px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full", styles[status])}>
      {labels[status]}
    </span>
  );
}
