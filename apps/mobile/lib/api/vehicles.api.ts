import { apiClient } from './client'
import type { Vehicle, Telemetry } from '@simon/types'

export async function getVehicles(): Promise<Vehicle[]> {
  return apiClient.get<Vehicle[]>('/vehicles')
}

export async function getVehicle(id: string): Promise<Vehicle & { latest_telemetry: Telemetry }> {
  return apiClient.get<Vehicle & { latest_telemetry: Telemetry }>(`/vehicles/${id}`)
}
