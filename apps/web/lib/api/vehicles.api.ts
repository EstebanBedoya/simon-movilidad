import { apiClient } from './client'
import type { Vehicle } from '@/types/vehicle.types'
import type { Telemetry } from '@/types/telemetry.types'

export async function getVehicles(): Promise<Vehicle[]> {
  const { data } = await apiClient.get<Vehicle[]>('/vehicles')
  return data
}

export async function getVehicle(id: string): Promise<Vehicle & { latest_telemetry: Telemetry }> {
  const { data } = await apiClient.get<Vehicle & { latest_telemetry: Telemetry }>(`/vehicles/${id}`)
  return data
}

export async function createVehicle(body: { name: string; city: string }): Promise<Vehicle> {
  const { data } = await apiClient.post<Vehicle>('/vehicles', body)
  return data
}

export async function updateVehicle(id: string, body: Partial<Pick<Vehicle, 'name' | 'city' | 'status'>>): Promise<Vehicle> {
  const { data } = await apiClient.put<Vehicle>(`/vehicles/${id}`, body)
  return data
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiClient.delete(`/vehicles/${id}`)
}
