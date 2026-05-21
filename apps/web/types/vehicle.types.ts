import type { Telemetry } from './telemetry.types'

export type City =
  | 'medellin'
  | 'bogota'
  | 'cali'
  | 'barranquilla'
  | 'cartagena'
  | 'bucaramanga'

export type VehicleStatus = 'active' | 'inactive'

export interface Vehicle {
  id: string
  device_id: string
  name: string
  city: City
  status: VehicleStatus
  created_at: string
  latest_telemetry?: Telemetry
}
