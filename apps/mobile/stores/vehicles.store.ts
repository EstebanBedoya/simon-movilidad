import { create } from 'zustand'
import type { Vehicle, Telemetry } from '@simon/types'

interface VehiclesState {
  vehicles: Vehicle[]
  selectedVehicleId: string | null
  isLoading: boolean
  error: string | null
}

interface VehiclesActions {
  setVehicles: (vehicles: Vehicle[]) => void
  updateVehiclePosition: (vehicleId: string, telemetry: Telemetry) => void
  selectVehicle: (id: string | null) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
}

export const useVehiclesStore = create<VehiclesState & VehiclesActions>()((set) => ({
  vehicles: [],
  selectedVehicleId: null,
  isLoading: false,
  error: null,

  setVehicles: (vehicles) => set({ vehicles }),

  updateVehiclePosition: (vehicleId, telemetry) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, latest_telemetry: telemetry } : v
      ),
    })),

  selectVehicle: (selectedVehicleId) => set({ selectedVehicleId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
