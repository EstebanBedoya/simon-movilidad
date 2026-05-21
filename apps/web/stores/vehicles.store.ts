import { create } from 'zustand'
import type { Vehicle } from '@/types/vehicle.types'
import type { Telemetry } from '@/types/telemetry.types'

interface VehiclesState {
  vehicles: Vehicle[]
  isLoading: boolean
  error: string | null
}

interface VehiclesActions {
  setVehicles: (vehicles: Vehicle[]) => void
  updateVehiclePosition: (vehicleId: string, telemetry: Telemetry) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
}

export const useVehiclesStore = create<VehiclesState & VehiclesActions>()((set) => ({
  vehicles: [],
  isLoading: false,
  error: null,
  setVehicles: (vehicles) => set({ vehicles }),
  updateVehiclePosition: (vehicleId, telemetry) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, latest_telemetry: telemetry } : v
      ),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
