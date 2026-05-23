'use client'

import { useState, useRef, useEffect } from 'react'
import { Filter, Expand, Plus } from 'lucide-react'
import { AlertBanner } from '@/components/molecules/AlertBanner'
import { FilterPanel } from '@/components/molecules/FilterPanel'
import { MapPanel } from '@/components/organisms/MapPanel'
import { RightColumn } from '@/components/organisms/RightColumn'
import { CardsStrip } from '@/components/organisms/CardsStrip'
import { Button } from '@/components/atoms/Button'
import { useVehiclesStore } from '@/stores/vehicles.store'
import { useAlertsStore } from '@/stores/alerts.store'
import { useAuthStore } from '@/stores/auth.store'
import { DEFAULT_FILTERS, activeFilterCount } from '@/types/filters'
import type { FleetFilters } from '@/types/filters'

export default function DashboardPage() {
  const vehicles = useVehiclesStore((s) => s.vehicles)
  const alerts = useAlertsStore((s) => s.alerts)
  const role = useAuthStore((s) => s.user?.role)
  const [selectedId, setSelectedId] = useState('')
  const [filters, setFilters] = useState<FleetFilters>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  const criticalAlert = role === 'admin'
    ? alerts.find((a) => a.type === 'low_fuel' && !a.resolved && a.id !== dismissedAlertId)
    : undefined

  const selected = vehicles.find((v) => v.id === selectedId) ?? vehicles[0]
  const effectiveSelectedId = selected?.id ?? ''
  const filterCount = activeFilterCount(filters)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    if (filterOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  return (
    <div className="grid min-h-0 min-w-0 overflow-hidden h-full" style={{ gridTemplateRows: 'auto minmax(0,1fr) auto' }}>
      <div className="flex items-center gap-3.5 px-[18px] py-[14px] bg-bg border-b border-hairline min-w-0 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-[17px] font-semibold tracking-[-0.018em] m-0">Live Map</h1>
          <div className="text-[11.5px] text-foreground-muted font-mono mt-0.5">
            {vehicles.length} vehículos · datos en tiempo real
          </div>
        </div>
        <div className="flex-1" />
        <div ref={filterRef} className="relative">
          <Button
            variant="default"
            onClick={() => setFilterOpen((o) => !o)}
            className={filterCount > 0 ? 'border-accent text-accent' : ''}
          >
            <Filter size={13} />
            Filtros
            {filterCount > 0 && (
              <span className="w-[18px] h-[18px] rounded-full bg-accent text-bg text-[9px] font-mono font-bold grid place-items-center">
                {filterCount}
              </span>
            )}
          </Button>
          {filterOpen && <FilterPanel filters={filters} onChange={setFilters} />}
        </div>
        <Button variant="icon"><Expand size={13} /></Button>
        <Button variant="primary"><Plus size={13} /> Nueva geocerca</Button>
      </div>

      <div className="grid min-h-0 min-w-0 overflow-hidden" style={{ gridTemplateColumns: 'minmax(0,1fr) 380px' }}>
        <div className="flex flex-col min-w-0 min-h-0 overflow-hidden">
          {criticalAlert && (
            <AlertBanner
              alert={criticalAlert}
              onDismiss={() => setDismissedAlertId(criticalAlert.id)}
            />
          )}
          <div className="flex-1 min-h-0">
            <MapPanel
              fleet={vehicles}
              selectedId={effectiveSelectedId}
              onSelect={setSelectedId}
            />
          </div>
        </div>
        <RightColumn selected={selected} />
      </div>

      <CardsStrip
        fleet={vehicles}
        selectedId={effectiveSelectedId}
        onSelect={setSelectedId}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  )
}
