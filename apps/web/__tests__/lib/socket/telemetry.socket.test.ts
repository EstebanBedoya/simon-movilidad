import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Telemetry } from '@/types/telemetry.types'

// Build a mock socket we can fully control
const createMockSocket = () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
})

let mockSocket: ReturnType<typeof createMockSocket>

vi.mock('@/lib/socket/socket.client', () => ({
  getSocket: vi.fn(() => mockSocket),
}))

beforeEach(() => {
  vi.resetModules()
  mockSocket = createMockSocket()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('subscribeTelemetry', () => {
  it('calls socket.off before socket.on for deduplication', async () => {
    const { subscribeTelemetry } = await import('@/lib/socket/telemetry.socket')

    subscribeTelemetry(vi.fn())

    const offCallIndex = mockSocket.off.mock.invocationCallOrder[0]
    const onCallIndex = mockSocket.on.mock.invocationCallOrder[0]
    expect(offCallIndex).toBeLessThan(onCallIndex)
  })

  it('registers the vehicle:location event', async () => {
    const { subscribeTelemetry } = await import('@/lib/socket/telemetry.socket')

    subscribeTelemetry(vi.fn())

    expect(mockSocket.off).toHaveBeenCalledWith('vehicle:location')
    expect(mockSocket.on.mock.calls[0][0]).toBe('vehicle:location')
  })

  it('maps incoming VehicleLocationEvent to Telemetry domain object', async () => {
    const { subscribeTelemetry } = await import('@/lib/socket/telemetry.socket')

    const callback = vi.fn()
    subscribeTelemetry(callback)

    // Capture and invoke the registered handler
    const handler = mockSocket.on.mock.calls[0][1] as (data: unknown) => void
    handler({
      vehicleId: 'v1',
      deviceId: 'dev-001',
      lat: 6.2,
      lng: -75.5,
      speed: 50,
      fuel_level: 65,
      temperature: 28,
      timestamp: '2024-01-01T12:00:00Z',
    })

    expect(callback).toHaveBeenCalledOnce()
    const received = callback.mock.calls[0][0] as Telemetry & { vehicleId: string }
    expect(received).toMatchObject({
      vehicle_id: 'v1',
      vehicleId: 'v1',
      lat: 6.2,
      lng: -75.5,
      speed: 50,
      fuel_level: 65,
      temperature: 28,
      timestamp: '2024-01-01T12:00:00Z',
    })
  })

  it('returns an unsubscribe function that calls socket.off', async () => {
    const { subscribeTelemetry } = await import('@/lib/socket/telemetry.socket')

    const unsubscribe = subscribeTelemetry(vi.fn())
    unsubscribe()

    const offCalls = mockSocket.off.mock.calls.map(([event]) => event)
    // off is called once for dedup and once for cleanup
    expect(offCalls.filter((e) => e === 'vehicle:location').length).toBeGreaterThanOrEqual(2)
  })
})
