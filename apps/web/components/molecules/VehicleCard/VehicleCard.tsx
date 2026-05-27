"use client";
import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { FuelBar } from "@/components/atoms/FuelBar";
import { MetricItem } from "@/components/atoms/MetricItem";
import { VehicleStatusBadge } from "@/components/atoms/VehicleStatusBadge";
import { deriveUiStatus } from "@/types/fleet";
import { useAlertsStore } from "@/stores/alerts.store";
import type { Vehicle } from "@/types/vehicle.types";

interface VehicleCardProps {
  vehicle: Vehicle;
  selected?: boolean;
  onClick?: () => void;
}

export function VehicleCard({ vehicle: v, selected, onClick }: VehicleCardProps) {
  const allAlerts = useAlertsStore((s) => s.alerts);
  const alerts = useMemo(() => allAlerts.filter((a) => a.vehicle_id === v.id), [allAlerts, v.id]);
  const uiStatus = deriveUiStatus(v, alerts);

  const fuel = v.latest_telemetry?.fuel_level ?? 0;
  const temp = v.latest_telemetry?.temperature ?? 0;
  const speed = v.latest_telemetry?.speed ?? 0;

  const fuelState = fuel < 15 ? "danger" : fuel < 35 ? "warn" : "ok";
  const tempState = temp > 90 ? "danger" : temp > 85 ? "warn" : "ok";

  return (
    <div
      className={cn(
        "relative flex-shrink-0 w-[232px] flex flex-col gap-[7px] p-[10px_11px] rounded border cursor-pointer transition-all duration-150 overflow-hidden",
        selected
          ? "bg-surface-2 border-accent-line"
          : "bg-surface-1 border-hairline hover:bg-surface-2 hover:border-hairline-strong",
        uiStatus === "alert" && !selected && "border-danger/35"
      )}
      onClick={onClick}
    >
      {selected && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />}

      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[11px] font-medium text-foreground truncate">
          {v.device_id}
        </div>
        <VehicleStatusBadge status={uiStatus} />
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-medium text-foreground">{v.name}</span>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-foreground-muted">
          <MapPin size={10} />
          {v.city}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-hairline">
        <MetricItem label="Comb." value={Math.round(fuel)} unit="%" state={fuelState}>
          <FuelBar value={fuel} />
        </MetricItem>
        <MetricItem label="Temp." value={uiStatus === "offline" ? "--" : Math.round(temp)} unit="°C" state={tempState} />
        <MetricItem label="Vel." value={Math.round(speed)} unit="km/h" />
      </div>
    </div>
  );
}
