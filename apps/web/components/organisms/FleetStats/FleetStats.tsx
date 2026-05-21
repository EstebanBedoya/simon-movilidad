"use client";
import { StatCard } from "@/components/molecules/StatCard";
import { useVehiclesStore } from "@/stores/vehicles.store";
import { useAlertsStore } from "@/stores/alerts.store";
import { deriveUiStatus } from "@/types/fleet";

export function FleetStats() {
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const alerts = useAlertsStore((s) => s.alerts);
  const unresolvedCount = useAlertsStore((s) => s.unresolvedCount);

  const counts = vehicles.reduce(
    (acc, v) => {
      const vehicleAlerts = alerts.filter((a) => a.vehicle_id === v.id);
      const status = deriveUiStatus(v, vehicleAlerts);
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    { active: 0, idle: 0, alert: 0, offline: 0 } as Record<string, number>
  );

  const total = vehicles.length;

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard label="En ruta"      value={counts.active}  unit={`/${total}`} trendDir="up" />
      <StatCard label="Detenidos"    value={counts.idle}    unit={`/${total}`} />
      <StatCard label="Con alerta"   value={counts.alert}   trend={`${unresolvedCount} sin resolver`} danger={counts.alert > 0} />
      <StatCard label="Sin señal"    value={counts.offline} unit={`/${total}`} />
    </div>
  );
}
