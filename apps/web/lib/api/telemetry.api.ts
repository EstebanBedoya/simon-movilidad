import { apiClient } from './client'
import type { Telemetry, TelemetryPage } from '@/types/telemetry.types'

export async function getHistory(
  vehicleId: string,
  params?: { page?: number; limit?: number; from?: string; to?: string }
): Promise<TelemetryPage> {
  const { data } = await apiClient.get<TelemetryPage>(`/telemetry/${vehicleId}`, { params })
  return data
}

export async function getLatest(vehicleId: string): Promise<Telemetry> {
  const { data } = await apiClient.get<Telemetry>(`/telemetry/${vehicleId}/latest`)
  return data
}
