import { getSocket } from './socket.client'
import type { Alert } from '@/types/alert.types'

interface AlertCreatedEvent {
  alertId: string
  vehicleId: string
  vehicleName: string
  type: Alert['type']
  message: string
  created_at: string
}

export function subscribeAlerts(onAlert: (alert: Alert) => void): () => void {
  const socket = getSocket('/alerts')

  socket.off('alert:created')
  socket.on('alert:created', (data: AlertCreatedEvent) => {
    onAlert({
      id: data.alertId,
      vehicle_id: data.vehicleId,
      vehicle_name: data.vehicleName,
      type: data.type,
      message: data.message,
      resolved: false,
      created_at: data.created_at,
    })
  })

  return () => {
    socket.off('alert:created')
  }
}
