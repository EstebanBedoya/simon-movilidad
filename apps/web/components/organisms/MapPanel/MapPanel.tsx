'use client'

import dynamic from 'next/dynamic'
import { useRef, useEffect } from 'react'
import { useMap } from '@/hooks/use-map'
import { deriveUiStatus } from '@/types/fleet'
import { useAlertsStore } from '@/stores/alerts.store'
import type { Vehicle } from '@/types/vehicle.types'

interface MapPanelProps {
  fleet: Vehicle[]
  selectedId: string
  onSelect: (id: string) => void
}

function MapPanelInner({ fleet, selectedId }: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const alerts = useAlertsStore((s) => s.alerts)
  const { isReady, addVehicleMarker, updateVehicleMarker, flyToVehicle, setSelectedMarker } = useMap(containerRef)
  const initializedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isReady) return
    fleet.forEach((vehicle) => {
      const telemetry = vehicle.latest_telemetry
      if (!telemetry) return
      const vehicleAlerts = alerts.filter((a) => a.vehicle_id === vehicle.id)
      const status = deriveUiStatus(vehicle, vehicleAlerts)
      if (initializedRef.current.has(vehicle.id)) {
        updateVehicleMarker(vehicle.id, telemetry, status)
      } else {
        addVehicleMarker(vehicle.id, telemetry, status)
        initializedRef.current.add(vehicle.id)
      }
    })
  }, [fleet, alerts, isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isReady || !selectedId) return
    const vehicle = fleet.find((v) => v.id === selectedId)
    const telemetry = vehicle?.latest_telemetry
    if (telemetry) flyToVehicle(telemetry.lng, telemetry.lat)
    setSelectedMarker(selectedId)
  }, [selectedId, isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-full min-h-0">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-1 text-foreground-muted text-sm">
          Cargando mapa…
        </div>
      )}
    </div>
  )
}

const MapPanelDynamic = dynamic(() => Promise.resolve(MapPanelInner), { ssr: false })

export function MapPanel(props: MapPanelProps) {
  return <MapPanelDynamic {...props} />
}
