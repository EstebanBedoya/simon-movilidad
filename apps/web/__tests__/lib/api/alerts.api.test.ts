import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getAlerts, getVehicleAlerts, resolveAlert } from '@/lib/api/alerts.api'
import type { Alert } from '@/types/alert.types'

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ token: null, logout: vi.fn() })),
  },
}))

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockAlert: Alert = {
  id: 'a1',
  vehicle_id: 'v1',
  vehicle_name: 'Bus 01',
  type: 'low_fuel',
  message: 'Fuel below 20%',
  resolved: false,
  created_at: '2024-01-01T10:00:00Z',
}

describe('getAlerts', () => {
  it('calls GET /alerts and returns alert array', async () => {
    server.use(
      http.get('*/alerts', () => HttpResponse.json([mockAlert]))
    )

    const result = await getAlerts()

    expect(result).toEqual([mockAlert])
  })

  it('passes resolved query param when provided', async () => {
    let capturedUrl: string | undefined
    server.use(
      http.get('*/alerts', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([])
      })
    )

    await getAlerts({ resolved: true })

    expect(capturedUrl).toContain('resolved=true')
  })

  it('passes type query param when provided', async () => {
    let capturedUrl: string | undefined
    server.use(
      http.get('*/alerts', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([])
      })
    )

    await getAlerts({ type: 'low_fuel' })

    expect(capturedUrl).toContain('type=low_fuel')
  })
})

describe('getVehicleAlerts', () => {
  it('calls GET /alerts/:vehicleId and returns alert array', async () => {
    server.use(
      http.get('*/alerts/v1', () => HttpResponse.json([mockAlert]))
    )

    const result = await getVehicleAlerts('v1')

    expect(result).toEqual([mockAlert])
  })
})

describe('resolveAlert', () => {
  it('calls PATCH /alerts/:id/resolve and returns resolution payload', async () => {
    const resolution = { id: 'a1', resolved: true, resolved_at: '2024-01-01T11:00:00Z' }
    server.use(
      http.patch('*/alerts/a1/resolve', () => HttpResponse.json(resolution))
    )

    const result = await resolveAlert('a1')

    expect(result).toEqual(resolution)
  })
})
