export type { UserRole, AuthUser, AuthTokenPayload } from './auth.types'
export type { Vehicle, VehicleStatus, City } from './vehicle.types'
export type { Telemetry, TelemetryPage } from './telemetry.types'
export type { Alert, AlertType } from './alert.types'

import type { Vehicle } from './vehicle.types'
import type { Alert } from './alert.types'
export type UIVehicleStatus = 'active' | 'idle' | 'alert' | 'offline'

export function deriveUiStatus(vehicle: Vehicle, vehicleAlerts: Alert[]): UIVehicleStatus {
  if (vehicle.status === 'inactive') return 'offline'
  const hasUnresolved = vehicleAlerts.some((a) => !a.resolved)
  if (hasUnresolved) return 'alert'
  const speed = vehicle.latest_telemetry?.speed ?? null
  if (speed === null) return 'offline'
  if (speed === 0) return 'idle'
  return 'active'
}

export function computeHeading(
  prev: { lat: number; lng: number },
  curr: { lat: number; lng: number }
): number {
  const dLng = curr.lng - prev.lng
  const dLat = curr.lat - prev.lat
  const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI
  return (angle + 360) % 360
}


