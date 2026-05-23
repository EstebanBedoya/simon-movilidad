import { apiClient } from './client'
import type { Alert } from '@simon/types'

export async function getAlerts(params?: { resolved?: boolean; type?: string }): Promise<Alert[]> {
  return apiClient.get<Alert[]>('/alerts', { params })
}

export async function resolveAlert(id: string): Promise<{ id: string; resolved: boolean; resolved_at: string }> {
  return apiClient.patch(`/alerts/${id}/resolve`)
}
