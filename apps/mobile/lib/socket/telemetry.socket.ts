import { getSocket } from './socket.manager'
import type { Telemetry } from '@simon/types'

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

export async function subscribeTelemetry(
  onData: (telemetry: Telemetry & { vehicleId: string }) => void
): Promise<() => void> {
  const socket = await getSocket('/telemetry')

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
