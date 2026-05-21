"use client";
import { FleetStats } from "@/components/organisms/FleetStats";
import { SparkBlock } from "@/components/molecules/SparkBlock";
import { AlertRow } from "@/components/molecules/AlertRow";
import { useAlertsStore } from "@/stores/alerts.store";
import { useAuthStore } from "@/stores/auth.store";
import { resolveAlert } from "@/lib/api/alerts.api";
import { useTelemetryHistory } from "@/hooks/use-telemetry-history";
import type { Vehicle } from "@/types/vehicle.types";

interface RightColumnProps {
  selected: Vehicle | undefined;
}

export function RightColumn({ selected }: RightColumnProps) {
  const alerts = useAlertsStore((s) => s.alerts);
  const resolveInStore = useAlertsStore((s) => s.resolveAlert);
  const role = useAuthStore((s) => s.user?.role);

  const { data: history } = useTelemetryHistory(selected?.id ?? "", { limit: 32 });

  const speedData = history.map((t) => t.speed);
  const fuelData = history.map((t) => t.fuel_level);

  const lastSpeed = speedData.at(-1) ?? selected?.latest_telemetry?.speed ?? 0;
  const fuel = fuelData.at(-1) ?? selected?.latest_telemetry?.fuel_level ?? 0;
  const fuelColor = fuel < 15 ? "var(--danger)" : fuel < 35 ? "var(--warning)" : "var(--accent)";

  const vehicleAlerts = selected
    ? alerts.filter((a) => a.vehicle_id === selected.id && !a.resolved)
    : [];

  const axisLabels = ["-30m", "-20m", "-10m", "ahora"];

  async function handleResolve(id: string) {
    const result = await resolveAlert(id);
    resolveInStore(id, result.resolved_at);
  }

  return (
    <aside className="w-[380px] flex-shrink-0 border-l border-hairline bg-bg overflow-y-auto min-h-0">
      <section className="p-[14px_16px] border-b border-hairline">
        <div className="flex items-center gap-2 mb-2.5">
          <h3 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-foreground m-0">Estado de flota</h3>
          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold tracking-[0.14em] uppercase text-accent ml-auto before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent before:shadow-[0_0_0_3px_var(--accent-soft)] before:[animation:pulse-ring_2s_infinite]">
            En vivo
          </span>
        </div>
        <FleetStats />
      </section>

      <section className="p-[14px_16px] border-b border-hairline">
        <div className="flex items-center gap-2 mb-2.5">
          <h3 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-foreground m-0">
            Historial · {selected?.name ?? "flota"}
          </h3>
          <span className="text-[10.5px] text-foreground-dim font-mono ml-auto">últ. 30 min</span>
        </div>
        <div className="flex flex-col gap-2">
          <SparkBlock label="Velocidad" value={Math.round(lastSpeed)} unit=" km/h" color="var(--accent)" data={speedData} axisLabels={axisLabels} />
          <SparkBlock label="Combustible" value={Math.round(fuel)} unit="%" color={fuelColor} data={fuelData} axisLabels={axisLabels} />
        </div>
      </section>

      {role === "admin" && (
        <section className="p-[14px_16px]">
          <div className="flex items-center gap-2 mb-2.5">
            <h3 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-foreground m-0">Alertas activas</h3>
            <span className="text-[10.5px] text-foreground-dim font-mono ml-auto">{vehicleAlerts.length} abiertas</span>
          </div>
          <div className="flex flex-col gap-2">
            {vehicleAlerts.length === 0 ? (
              <p className="text-[11px] text-foreground-muted">Sin alertas activas</p>
            ) : (
              vehicleAlerts.map((a) => <AlertRow key={a.id} alert={a} onResolve={handleResolve} />)
            )}
          </div>
        </section>
      )}
    </aside>
  );
}
