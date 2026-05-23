"use client";
import { Download } from "lucide-react";
import { FilterChip } from "@/components/atoms/FilterChip";
import { VehicleCard } from "@/components/molecules/VehicleCard";
import { Button } from "@/components/atoms/Button";
import { deriveUiStatus } from "@/types/fleet";
import { useAlertsStore } from "@/stores/alerts.store";
import type { Vehicle } from "@/types/vehicle.types";
import type { UIVehicleStatus } from "@/types/fleet";
import type { FleetFilters } from "@/types/filters";

const STATUS_CHIPS: { id: "all" | UIVehicleStatus; label: string; dot: string }[] = [
  { id: "all",     label: "Toda la flota", dot: "transparent" },
  { id: "active",  label: "En ruta",       dot: "var(--accent)" },
  { id: "idle",    label: "Detenidos",     dot: "var(--warning)" },
  { id: "alert",   label: "Con alerta",    dot: "var(--danger)" },
  { id: "offline", label: "Sin señal",     dot: "rgba(255,255,255,0.25)" },
];

interface CardsStripProps {
  fleet: Vehicle[];
  selectedId: string;
  onSelect: (id: string) => void;
  filters: FleetFilters;
  onFiltersChange: (f: FleetFilters) => void;
}

export function CardsStrip({ fleet, selectedId, onSelect, filters, onFiltersChange }: CardsStripProps) {
  const alerts = useAlertsStore((s) => s.alerts);

  const withStatus = fleet.map((v) => ({
    vehicle: v,
    uiStatus: deriveUiStatus(v, alerts.filter((a) => a.vehicle_id === v.id)),
  }));

  const filtered = withStatus.filter(({ vehicle, uiStatus }) => {
    const statusMatch = filters.status === "all" || uiStatus === filters.status;
    const cityMatch = filters.cities.length === 0 || filters.cities.includes(vehicle.city);
    return statusMatch && cityMatch;
  });

  return (
    <section className="bg-bg border-t border-hairline px-4 pt-[10px] pb-3 flex-shrink-0 min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center gap-3 mb-2 min-w-0">
        <h3 className="text-[12px] font-semibold tracking-[-0.005em] m-0 flex-shrink-0">Vehículos</h3>
        <span className="text-[10.5px] font-mono text-foreground-dim px-[7px] py-[1px] border border-hairline rounded-full">
          {filtered.length} de {fleet.length}
        </span>
        <div className="flex-1" />
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_CHIPS.map((chip) => (
            <FilterChip
              key={chip.id}
              label={chip.label}
              dot={chip.dot}
              count={chip.id === "all" ? fleet.length : withStatus.filter(({ uiStatus }) => uiStatus === chip.id).length}
              active={filters.status === chip.id}
              onClick={() => onFiltersChange({ ...filters, status: chip.id })}
            />
          ))}
        </div>
        <Button variant="default" className="gap-1.5 flex-shrink-0">
          <Download size={13} /> Exportar
        </Button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 [scroll-snap-type:x_proximity] min-w-0 [&::-webkit-scrollbar]:h-1.5">
        {filtered.map(({ vehicle }) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            selected={selectedId === vehicle.id}
            onClick={() => onSelect(vehicle.id)}
          />
        ))}
      </div>
    </section>
  );
}
