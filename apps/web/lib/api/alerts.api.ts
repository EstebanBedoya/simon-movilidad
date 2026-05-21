import { apiClient } from './client'
import type { Alert } from '@/types/alert.types'

export async function getAlerts(params?: { resolved?: boolean; type?: string }): Promise<Alert[]> {
  const { data } = await apiClient.get<Alert[]>('/alerts', { params })
  return data
}

export async function getVehicleAlerts(vehicleId: string): Promise<Alert[]> {
  const { data } = await apiClient.get<Alert[]>(`/alerts/${vehicleId}`)
  return data
}

export async function resolveAlert(id: string): Promise<{ id: string; resolved: boolean; resolved_at: string }> {
  const { data } = await apiClient.patch(`/alerts/${id}/resolve`)
  return data
}
