'use client'

import { useState } from 'react'
import { Filter, Expand, Plus } from 'lucide-react'
import { AlertBanner } from '@/components/molecules/AlertBanner'
import { MapPanel } from '@/components/organisms/MapPanel'
import { RightColumn } from '@/components/organisms/RightColumn'
import { CardsStrip } from '@/components/organisms/CardsStrip'
import { Button } from '@/components/atoms/Button'
import { useVehiclesStore } from '@/stores/vehicles.store'
import type { UIVehicleStatus } from '@/types/fleet'

type FilterId = 'all' | UIVehicleStatus

export default function DashboardPage() {
  const vehicles = useVehiclesStore((s) => s.vehicles)
  const [selectedId, setSelectedId] = useState('')
  const [filter, setFilter] = useState<FilterId>('all')
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const selected = vehicles.find((v) => v.id === selectedId) ?? vehicles[0]
  const effectiveSelectedId = selected?.id ?? ''

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
        <Button variant="default"><Filter size={13} /> Filtros</Button>
        <Button variant="icon"><Expand size={13} /></Button>
        <Button variant="primary"><Plus size={13} /> Nueva geocerca</Button>
      </div>

      <div className="grid min-h-0 min-w-0 overflow-hidden" style={{ gridTemplateColumns: 'minmax(0,1fr) 380px' }}>
        <div className="grid min-w-0 min-h-0 overflow-hidden" style={{ gridTemplateRows: 'auto 1fr' }}>
          {!bannerDismissed && <AlertBanner onDismiss={() => setBannerDismissed(true)} />}
          <MapPanel
            fleet={vehicles}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedId}
          />
        </div>
        <RightColumn selected={selected} />
      </div>

      <CardsStrip
        fleet={vehicles}
        selectedId={effectiveSelectedId}
        onSelect={setSelectedId}
        filter={filter}
        onFilter={setFilter}
      />
    </div>
  )
}
