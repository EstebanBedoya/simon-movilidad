"use client";
import { Filter, Download } from "lucide-react";
import { FilterChip } from "@/components/atoms/FilterChip";
import { VehicleCard } from "@/components/molecules/VehicleCard";
import { Button } from "@/components/atoms/Button";
import { deriveUiStatus } from "@/types/fleet";
import { useAlertsStore } from "@/stores/alerts.store";
import type { Vehicle } from "@/types/vehicle.types";
import type { UIVehicleStatus } from "@/types/fleet";

type FilterId = "all" | UIVehicleStatus;

interface CardsStripProps {
  fleet: Vehicle[];
  selectedId: string;
  onSelect: (id: string) => void;
  filter: FilterId;
  onFilter: (f: FilterId) => void;
}

export function CardsStrip({ fleet, selectedId, onSelect, filter, onFilter }: CardsStripProps) {
  const alerts = useAlertsStore((s) => s.alerts);

  const filters: { id: FilterId; label: string; dot: string }[] = [
    { id: "all",     label: "Toda la flota", dot: "transparent" },
    { id: "active",  label: "En ruta",       dot: "var(--accent)" },
    { id: "idle",    label: "Detenidos",     dot: "var(--warning)" },
    { id: "alert",   label: "Con alerta",    dot: "var(--danger)" },
    { id: "offline", label: "Sin señal",     dot: "rgba(255,255,255,0.25)" },
  ];

  const withStatus = fleet.map((v) => ({
    vehicle: v,
    uiStatus: deriveUiStatus(v, alerts.filter((a) => a.vehicle_id === v.id)),
  }));

  const filtered = filter === "all"
    ? withStatus
    : withStatus.filter(({ uiStatus }) => uiStatus === filter);

  return (
    <section className="bg-bg border-t border-hairline px-4 pt-[10px] pb-3 flex-shrink-0 min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center gap-3 mb-2 min-w-0">
        <h3 className="text-[12px] font-semibold tracking-[-0.005em] m-0 flex-shrink-0">Vehículos</h3>
        <span className="text-[10.5px] font-mono text-foreground-dim px-[7px] py-[1px] border border-hairline rounded-full">
          {filtered.length} de {fleet.length}
        </span>
        <div className="flex-1" />
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              dot={f.dot}
              count={f.id === "all" ? fleet.length : withStatus.filter(({ uiStatus }) => uiStatus === f.id).length}
              active={filter === f.id}
              onClick={() => onFilter(f.id)}
            />
          ))}
        </div>
        <Button variant="ghost" className="gap-1.5 flex-shrink-0">
          <Filter size={13} /> Filtros
        </Button>
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
