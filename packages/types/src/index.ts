export type { User, ApiResponse, PaginatedResponse } from './legacy'

export type { Telemetry, TelemetryPage } from './telemetry'
export type { City, VehicleStatus, Vehicle } from './vehicle'
export type { AlertType, Alert } from './alert'
export type { UserRole, AuthUser, AuthTokenPayload } from './auth'
export type { UIVehicleStatus } from './fleet'
export { deriveUiStatus, computeHeading } from './fleet'
