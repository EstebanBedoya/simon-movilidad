import { getSocket } from './socket.client'
import type { Telemetry } from '@/types/telemetry.types'

interface VehicleLocationEvent {
  vehicleId: string
  deviceId: string
  lat: number
  lng: number
  speed: number
  fuel_level: number
  temperature: number
  timestamp: string
}

export function subscribeTelemetry(onData: (telemetry: Telemetry & { vehicleId: string }) => void): () => void {
  const socket = getSocket('/telemetry')

  socket.off('vehicle:location')
  socket.on('vehicle:location', (data: VehicleLocationEvent) => {
    onData({
      vehicle_id: data.vehicleId,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      fuel_level: data.fuel_level,
      temperature: data.temperature,
      timestamp: data.timestamp,
      vehicleId: data.vehicleId,
    })
  })

  return () => {
    socket.off('vehicle:location')
  }
}
