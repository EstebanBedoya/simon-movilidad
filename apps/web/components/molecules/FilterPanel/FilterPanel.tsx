'use client'

import { FilterChip } from '@/components/atoms/FilterChip'
import type { UIVehicleStatus } from '@/types/fleet'
import type { City } from '@/types/vehicle.types'
import type { FleetFilters } from '@/types/filters'
import { activeFilterCount } from '@/types/filters'

const STATUS_OPTIONS: { id: 'all' | UIVehicleStatus; label: string; dot: string }[] = [
  { id: 'all',     label: 'Todos',      dot: 'transparent' },
  { id: 'active',  label: 'En ruta',    dot: 'var(--accent)' },
  { id: 'idle',    label: 'Detenidos',  dot: 'var(--warning)' },
  { id: 'alert',   label: 'Con alerta', dot: 'var(--danger)' },
  { id: 'offline', label: 'Sin señal',  dot: 'rgba(255,255,255,0.25)' },
]

const CITY_OPTIONS: { id: City; label: string }[] = [
  { id: 'medellin',     label: 'Medellín' },
  { id: 'bogota',       label: 'Bogotá' },
  { id: 'cali',         label: 'Cali' },
  { id: 'barranquilla', label: 'Barranquilla' },
  { id: 'cartagena',    label: 'Cartagena' },
  { id: 'bucaramanga',  label: 'Bucaramanga' },
]

interface FilterPanelProps {
  filters: FleetFilters
  onChange: (f: FleetFilters) => void
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const count = activeFilterCount(filters)

  function toggleCity(city: City) {
    const cities = filters.cities.includes(city)
      ? filters.cities.filter((c) => c !== city)
      : [...filters.cities, city]
    onChange({ ...filters, cities })
  }

  return (
    <div className="absolute top-full right-0 mt-1.5 z-50 w-[272px] bg-surface-1 border border-hairline rounded-sm shadow-xl shadow-black/40">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-hairline">
        <span className="text-[11.5px] font-semibold text-foreground">Filtros</span>
        {count > 0 && (
          <button
            onClick={() => onChange({ status: 'all', cities: [] })}
            className="text-[10.5px] text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Limpiar ({count})
          </button>
        )}
      </div>

      <div className="p-3.5 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-dim mb-2">Estado</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.id}
                label={opt.label}
                dot={opt.dot}
                active={filters.status === opt.id}
                onClick={() => onChange({ ...filters, status: opt.id })}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-dim mb-2">Ciudad</p>
          <div className="flex flex-wrap gap-1.5">
            {CITY_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.id}
                label={opt.label}
                active={filters.cities.includes(opt.id)}
                onClick={() => toggleCity(opt.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
