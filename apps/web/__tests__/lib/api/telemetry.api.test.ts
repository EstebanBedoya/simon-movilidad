import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getHistory, getLatest } from '@/lib/api/telemetry.api'
import type { Telemetry, TelemetryPage } from '@/types/telemetry.types'

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ token: null, logout: vi.fn() })),
  },
}))

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockTelemetry: Telemetry = {
  id: 't1',
  vehicle_id: 'v1',
  lat: 6.2,
  lng: -75.5,
  speed: 45,
  fuel_level: 70,
  temperature: 22,
  timestamp: '2024-01-01T10:00:00Z',
}

const mockPage: TelemetryPage = {
  data: [mockTelemetry],
  total: 1,
  page: 1,
  limit: 20,
}

describe('getHistory', () => {
  it('calls GET /telemetry/:vehicleId and returns a TelemetryPage', async () => {
    server.use(
      http.get('*/telemetry/v1', () => HttpResponse.json(mockPage))
    )

    const result = await getHistory('v1')

    expect(result).toEqual(mockPage)
  })

  it('passes pagination params when provided', async () => {
    let capturedUrl: string | undefined
    server.use(
      http.get('*/telemetry/v1', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(mockPage)
      })
    )

    await getHistory('v1', { page: 2, limit: 10 })

    expect(capturedUrl).toContain('page=2')
    expect(capturedUrl).toContain('limit=10')
  })

  it('passes from/to date params when provided', async () => {
    let capturedUrl: string | undefined
    server.use(
      http.get('*/telemetry/v1', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(mockPage)
      })
    )

    await getHistory('v1', { from: '2024-01-01', to: '2024-01-31' })

    expect(capturedUrl).toContain('from=2024-01-01')
    expect(capturedUrl).toContain('to=2024-01-31')
  })
})

describe('getLatest', () => {
  it('calls GET /telemetry/:vehicleId/latest and returns Telemetry', async () => {
    server.use(
      http.get('*/telemetry/v1/latest', () => HttpResponse.json(mockTelemetry))
    )

    const result = await getLatest('v1')

    expect(result).toEqual(mockTelemetry)
  })
})
