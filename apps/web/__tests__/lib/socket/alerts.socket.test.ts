import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Alert } from '@/types/alert.types'

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

describe('subscribeAlerts', () => {
  it('calls socket.off before socket.on for deduplication', async () => {
    const { subscribeAlerts } = await import('@/lib/socket/alerts.socket')

    subscribeAlerts(vi.fn())

    const offCallIndex = mockSocket.off.mock.invocationCallOrder[0]
    const onCallIndex = mockSocket.on.mock.invocationCallOrder[0]
    expect(offCallIndex).toBeLessThan(onCallIndex)
  })

  it('registers the alert:created event', async () => {
    const { subscribeAlerts } = await import('@/lib/socket/alerts.socket')

    subscribeAlerts(vi.fn())

    expect(mockSocket.off).toHaveBeenCalledWith('alert:created')
    expect(mockSocket.on.mock.calls[0][0]).toBe('alert:created')
  })

  it('maps incoming AlertCreatedEvent to the Alert domain object', async () => {
    const { subscribeAlerts } = await import('@/lib/socket/alerts.socket')

    const callback = vi.fn()
    subscribeAlerts(callback)

    const handler = mockSocket.on.mock.calls[0][1] as (data: unknown) => void
    handler({
      alertId: 'a1',
      vehicleId: 'v1',
      vehicleName: 'Bus 01',
      type: 'high_temperature',
      message: 'Temperature above 90°C',
      created_at: '2024-01-01T12:00:00Z',
    })

    expect(callback).toHaveBeenCalledOnce()
    const received = callback.mock.calls[0][0] as Alert
    expect(received).toEqual({
      id: 'a1',
      vehicle_id: 'v1',
      vehicle_name: 'Bus 01',
      type: 'high_temperature',
      message: 'Temperature above 90°C',
      resolved: false,
      created_at: '2024-01-01T12:00:00Z',
    })
  })

  it('always sets resolved to false on incoming events', async () => {
    const { subscribeAlerts } = await import('@/lib/socket/alerts.socket')

    const callback = vi.fn()
    subscribeAlerts(callback)

    const handler = mockSocket.on.mock.calls[0][1] as (data: unknown) => void
    handler({
      alertId: 'a2',
      vehicleId: 'v2',
      vehicleName: 'Bus 02',
      type: 'offline',
      message: 'Vehicle offline',
      created_at: '2024-01-02T09:00:00Z',
    })

    const received = callback.mock.calls[0][0] as Alert
    expect(received.resolved).toBe(false)
  })

  it('returns an unsubscribe function that calls socket.off', async () => {
    const { subscribeAlerts } = await import('@/lib/socket/alerts.socket')

    const unsubscribe = subscribeAlerts(vi.fn())
    unsubscribe()

    const offCalls = mockSocket.off.mock.calls.map(([event]) => event)
    expect(offCalls.filter((e) => e === 'alert:created').length).toBeGreaterThanOrEqual(2)
  })
})
