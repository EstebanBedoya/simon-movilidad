import type { UIVehicleStatus } from '@/types/fleet'
import type { City } from '@/types/vehicle.types'

export interface FleetFilters {
  status: 'all' | UIVehicleStatus
  cities: City[]
}

export const DEFAULT_FILTERS: FleetFilters = { status: 'all', cities: [] }

export function activeFilterCount(f: FleetFilters): number {
  return (f.status !== 'all' ? 1 : 0) + f.cities.length
}
