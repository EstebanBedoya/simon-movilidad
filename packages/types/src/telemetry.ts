export interface Telemetry {
  id?: string
  vehicle_id: string
  lat: number
  lng: number
  speed: number
  fuel_level: number
  temperature: number
  timestamp: string
}

export interface TelemetryPage {
  data: Telemetry[]
  total: number
  page: number
  limit: number
}
