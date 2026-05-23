import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mocks must be declared before any import that triggers the module
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  }
  return { io: vi.fn(() => mockSocket) }
})

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ token: 'test-token', logout: vi.fn() })),
  },
}))

vi.mock('@/stores/connectivity.store', () => ({
  useConnectivityStore: {
    getState: vi.fn(() => ({
      setWsStatus: vi.fn(),
    })),
  },
}))

// Reset modules before each test so the internal Map singleton is fresh
beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('getSocket — singleton', () => {
  it('returns the same socket instance when called twice with the same namespace', async () => {
    const { getSocket } = await import('@/lib/socket/socket.client')

    const s1 = getSocket('/telemetry')
    const s2 = getSocket('/telemetry')

    expect(s1).toBe(s2)
  })

  it('returns different instances for different namespaces', async () => {
    const { io } = await import('socket.io-client')
    const { getSocket } = await import('@/lib/socket/socket.client')

    getSocket('/telemetry')
    getSocket('/alerts')

    expect(vi.mocked(io)).toHaveBeenCalledTimes(2)
  })
})

describe('getSocket — lifecycle event handlers', () => {
  it('registers connect, disconnect, and connect_error handlers', async () => {
    const { getSocket } = await import('@/lib/socket/socket.client')
    const socket = getSocket('/telemetry')

    const registeredEvents = vi.mocked(socket.on).mock.calls.map(([event]) => event)
    expect(registeredEvents).toContain('connect')
    expect(registeredEvents).toContain('disconnect')
    expect(registeredEvents).toContain('connect_error')
  })

  it('calls setWsStatus("LIVE") on connect event', async () => {
    const { useConnectivityStore } = await import('@/stores/connectivity.store')
    const setWsStatus = vi.fn()
    vi.mocked(useConnectivityStore.getState).mockReturnValue({ setWsStatus } as never)

    const { getSocket } = await import('@/lib/socket/socket.client')
    const socket = getSocket('/telemetry')

    // Find and invoke the connect handler
    const connectCall = vi.mocked(socket.on).mock.calls.find(([event]) => event === 'connect')
    const connectHandler = connectCall?.[1] as (() => void) | undefined
    connectHandler?.()

    expect(setWsStatus).toHaveBeenCalledWith('LIVE')
  })

  it('calls setWsStatus("RECONNECTING") on disconnect event', async () => {
    const { useConnectivityStore } = await import('@/stores/connectivity.store')
    const setWsStatus = vi.fn()
    vi.mocked(useConnectivityStore.getState).mockReturnValue({ setWsStatus } as never)

    const { getSocket } = await import('@/lib/socket/socket.client')
    const socket = getSocket('/telemetry')

    const disconnectCall = vi.mocked(socket.on).mock.calls.find(([event]) => event === 'disconnect')
    const disconnectHandler = disconnectCall?.[1] as (() => void) | undefined
    disconnectHandler?.()

    expect(setWsStatus).toHaveBeenCalledWith('RECONNECTING')
  })

  it('calls setWsStatus("DISCONNECTED") on connect_error event', async () => {
    const { useConnectivityStore } = await import('@/stores/connectivity.store')
    const setWsStatus = vi.fn()
    vi.mocked(useConnectivityStore.getState).mockReturnValue({ setWsStatus } as never)

    const { getSocket } = await import('@/lib/socket/socket.client')
    const socket = getSocket('/telemetry')

    const errorCall = vi.mocked(socket.on).mock.calls.find(([event]) => event === 'connect_error')
    const errorHandler = errorCall?.[1] as (() => void) | undefined
    errorHandler?.()

    expect(setWsStatus).toHaveBeenCalledWith('DISCONNECTED')
  })
})

describe('disconnectSocket', () => {
  it('calls socket.disconnect() and removes it from the internal map', async () => {
    const { getSocket, disconnectSocket } = await import('@/lib/socket/socket.client')

    const socket = getSocket('/telemetry')
    disconnectSocket('/telemetry')

    expect(socket.disconnect).toHaveBeenCalledOnce()

    // After disconnect, getSocket creates a new instance
    const { io } = await import('socket.io-client')
    const callsBefore = vi.mocked(io).mock.calls.length
    getSocket('/telemetry')
    expect(vi.mocked(io).mock.calls.length).toBe(callsBefore + 1)
  })

  it('does nothing when disconnecting a namespace that was never opened', async () => {
    const { disconnectSocket } = await import('@/lib/socket/socket.client')

    // Should not throw
    expect(() => disconnectSocket('/nonexistent')).not.toThrow()
  })
})
