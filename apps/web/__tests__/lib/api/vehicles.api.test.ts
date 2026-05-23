import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '@/lib/api/vehicles.api'
import type { Vehicle } from '@/types/vehicle.types'
import type { Telemetry } from '@/types/telemetry.types'

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ token: null, logout: vi.fn() })),
  },
}))

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockVehicle: Vehicle = {
  id: 'v1',
  device_id: 'dev1',
  name: 'Bus 01',
  city: 'medellin',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
}

const mockTelemetry: Telemetry = {
  id: 't1',
  vehicle_id: 'v1',
  lat: 6.2,
  lng: -75.5,
  speed: 40,
  fuel_level: 80,
  temperature: 25,
  timestamp: '2024-01-01T10:00:00Z',
}

describe('getVehicles', () => {
  it('calls GET /vehicles and returns the array', async () => {
    server.use(
      http.get('*/vehicles', () => HttpResponse.json([mockVehicle]))
    )

    const result = await getVehicles()

    expect(result).toEqual([mockVehicle])
  })
})

describe('getVehicle', () => {
  it('calls GET /vehicles/:id and returns vehicle with latest_telemetry', async () => {
    const payload = { ...mockVehicle, latest_telemetry: mockTelemetry }
    server.use(
      http.get('*/vehicles/v1', () => HttpResponse.json(payload))
    )

    const result = await getVehicle('v1')

    expect(result).toEqual(payload)
  })
})

describe('createVehicle', () => {
  it('calls POST /vehicles with body and returns new vehicle', async () => {
    let capturedBody: unknown
    server.use(
      http.post('*/vehicles', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockVehicle, { status: 201 })
      })
    )

    const result = await createVehicle({ name: 'Bus 01', city: 'medellin' })

    expect(capturedBody).toEqual({ name: 'Bus 01', city: 'medellin' })
    expect(result).toEqual(mockVehicle)
  })
})

describe('updateVehicle', () => {
  it('calls PUT /vehicles/:id with body and returns updated vehicle', async () => {
    let capturedBody: unknown
    server.use(
      http.put('*/vehicles/v1', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockVehicle, name: 'Bus 01 Updated' })
      })
    )

    const result = await updateVehicle('v1', { name: 'Bus 01 Updated' })

    expect(capturedBody).toEqual({ name: 'Bus 01 Updated' })
    expect(result.name).toBe('Bus 01 Updated')
  })
})

describe('deleteVehicle', () => {
  it('calls DELETE /vehicles/:id', async () => {
    let wasCalled = false
    server.use(
      http.delete('*/vehicles/v1', () => {
        wasCalled = true
        return new HttpResponse(null, { status: 204 })
      })
    )

    await deleteVehicle('v1')

    expect(wasCalled).toBe(true)
  })
})
