export const queryKeys = {
  vehicles: {
    all: () => ['vehicles'] as const,
    detail: (id: string) => ['vehicles', id] as const,
  },
  alerts: {
    all: (params?: { resolved?: boolean; type?: string }) => ['alerts', params] as const,
  },
  telemetry: {
    history: (vehicleId: string, params?: object) => ['telemetry', vehicleId, params] as const,
    latest: (vehicleId: string) => ['telemetry', vehicleId, 'latest'] as const,
  },
} as const
