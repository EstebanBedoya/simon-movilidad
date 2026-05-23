export type AlertType = 'low_fuel' | 'high_temperature' | 'speeding' | 'offline'

export interface Alert {
  id: string
  vehicle_id: string
  vehicle_name: string
  type: AlertType
  message: string
  resolved: boolean
  created_at: string
  resolved_at?: string
}
