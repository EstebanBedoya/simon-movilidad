import { apiClient } from './client'
import type { Telemetry, TelemetryPage } from '@simon/types'

export async function getHistory(
  vehicleId: string,
  params?: { page?: number; limit?: number; from?: string; to?: string }
): Promise<TelemetryPage> {
  return apiClient.get<TelemetryPage>(`/telemetry/${vehicleId}`, { params })
}

export async function getLatest(vehicleId: string): Promise<Telemetry> {
  return apiClient.get<Telemetry>(`/telemetry/${vehicleId}/latest`)
}
