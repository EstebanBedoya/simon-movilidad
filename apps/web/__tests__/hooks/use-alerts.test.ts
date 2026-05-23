import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAlerts } from '@/hooks/use-alerts'
import { useAlertsStore } from '@/stores/alerts.store'
import { useAuthStore } from '@/stores/auth.store'
import { useConnectivityStore } from '@/stores/connectivity.store'
import type { Alert } from '@/types/alert.types'
import type { AuthUser } from '@/types/auth.types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/api/alerts.api', () => ({
  getAlerts: vi.fn(),
}))

vi.mock('@/lib/db/alerts.store', () => ({
  saveAlerts: vi.fn().mockResolvedValue(undefined),
  getAlerts: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/socket/alerts.socket', () => ({
  subscribeAlerts: vi.fn(() => vi.fn()), // returns unsubscribe fn
}))

// sonner toast is a side-effect — mock it to prevent real DOM calls
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { getAlerts as fetchAlerts } from '@/lib/api/alerts.api'
import {
  getAlerts as idbGetAlerts,
  saveAlerts as idbSaveAlerts,
} from '@/lib/db/alerts.store'
import { subscribeAlerts } from '@/lib/socket/alerts.socket'

const mockFetchAlerts = vi.mocked(fetchAlerts)
const mockIdbGetAlerts = vi.mocked(idbGetAlerts)
const mockIdbSaveAlerts = vi.mocked(idbSaveAlerts)
const mockSubscribeAlerts = vi.mocked(subscribeAlerts)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'a1',
    vehicle_id: 'v1',
    vehicle_name: 'Bus 001',
    type: 'speeding',
    message: 'Speed exceeded',
    resolved: false,
    created_at: '2024-06-01T12:00:00.000Z',
    ...overrides,
  }
}

function makeAdminUser(): AuthUser {
  return { id: 'u1', email: 'admin@test.com', role: 'admin' }
}

function makeRegularUser(): AuthUser {
  return { id: 'u2', email: 'user@test.com', role: 'user' }
}

// ---------------------------------------------------------------------------
// Reset state between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  useAlertsStore.setState({ alerts: [], unresolvedCount: 0 })
  useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
  // Clear auth state (bypasses persist middleware)
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  // Default socket mock returns a no-op unsubscribe
  mockSubscribeAlerts.mockReturnValue(vi.fn())
  // Default IDB resolves empty
  mockIdbGetAlerts.mockResolvedValue([])
  mockIdbSaveAlerts.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Authorization guard
// ---------------------------------------------------------------------------

describe('useAlerts — non-admin role', () => {
  it('does not fetch alerts when user role is "user"', async () => {
    useAuthStore.setState({ user: makeRegularUser(), token: 't', isAuthenticated: true })

    renderHook(() => useAlerts())

    // Give effect a tick to run
    await new Promise((r) => setTimeout(r, 0))

    expect(mockFetchAlerts).not.toHaveBeenCalled()
  })

  it('does not subscribe to socket alerts when role is "user"', async () => {
    useAuthStore.setState({ user: makeRegularUser(), token: 't', isAuthenticated: true })

    renderHook(() => useAlerts())

    await new Promise((r) => setTimeout(r, 0))

    expect(mockSubscribeAlerts).not.toHaveBeenCalled()
  })

  it('does not fetch alerts when user is null', async () => {
    // user is null (logged out)
    renderHook(() => useAlerts())

    await new Promise((r) => setTimeout(r, 0))

    expect(mockFetchAlerts).not.toHaveBeenCalled()
  })

  it('returns empty alerts array when not admin', () => {
    useAuthStore.setState({ user: makeRegularUser(), token: 't', isAuthenticated: true })

    const { result } = renderHook(() => useAlerts())

    expect(result.current.alerts).toEqual([])
    expect(result.current.unresolvedCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Admin + online: fetch and save to IDB
// ---------------------------------------------------------------------------

describe('useAlerts — admin role, online', () => {
  it('fetches alerts and updates the store', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })

    const alert = makeAlert()
    mockFetchAlerts.mockResolvedValue([alert])

    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.alerts).toEqual([alert])
    })
  })

  it('saves fetched alerts to IDB', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })

    const alert = makeAlert()
    mockFetchAlerts.mockResolvedValue([alert])

    renderHook(() => useAlerts())

    await waitFor(() => {
      expect(mockIdbSaveAlerts).toHaveBeenCalledWith([alert])
    })
  })

  it('reflects unresolvedCount from the store', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })

    const unresolvedAlert = makeAlert({ resolved: false })
    const resolvedAlert = makeAlert({ id: 'a2', resolved: true })
    mockFetchAlerts.mockResolvedValue([unresolvedAlert, resolvedAlert])

    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.unresolvedCount).toBe(1)
    })
  })
})

// ---------------------------------------------------------------------------
// Admin + online: API error falls back to IDB
// ---------------------------------------------------------------------------

describe('useAlerts — admin role, online, API error', () => {
  it('falls back to IDB alerts when fetch fails', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })

    const cached = makeAlert({ id: 'cached-1' })
    mockFetchAlerts.mockRejectedValue(new Error('Network error'))
    mockIdbGetAlerts.mockResolvedValue([cached])

    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.alerts).toEqual([cached])
    })
  })

  it('does not throw if IDB also fails', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })

    mockFetchAlerts.mockRejectedValue(new Error('Network error'))
    mockIdbGetAlerts.mockRejectedValue(new Error('IDB error'))

    // Should not throw
    expect(() => renderHook(() => useAlerts())).not.toThrow()

    await new Promise((r) => setTimeout(r, 50))
    // Store remains empty
    expect(useAlertsStore.getState().alerts).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Admin + offline: read from IDB directly
// ---------------------------------------------------------------------------

describe('useAlerts — admin role, offline', () => {
  it('reads from IDB directly when offline', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })
    useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })

    const cached = makeAlert({ id: 'idb-1' })
    mockIdbGetAlerts.mockResolvedValue([cached])

    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.alerts).toEqual([cached])
    })
  })

  it('does not call fetchAlerts when offline', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })
    useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })

    mockIdbGetAlerts.mockResolvedValue([])

    renderHook(() => useAlerts())

    await new Promise((r) => setTimeout(r, 20))

    expect(mockFetchAlerts).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Socket subscription
// ---------------------------------------------------------------------------

describe('useAlerts — socket subscription', () => {
  it('subscribes to alerts socket when role is admin', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })
    mockFetchAlerts.mockResolvedValue([])

    renderHook(() => useAlerts())

    await new Promise((r) => setTimeout(r, 0))

    expect(mockSubscribeAlerts).toHaveBeenCalled()
  })

  it('calls addAlert when a socket event arrives', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })
    mockFetchAlerts.mockResolvedValue([])

    let capturedCallback!: (alert: Alert) => void
    mockSubscribeAlerts.mockImplementation((cb) => {
      capturedCallback = cb
      return vi.fn()
    })

    const { result } = renderHook(() => useAlerts())

    await new Promise((r) => setTimeout(r, 0))

    const newAlert = makeAlert({ id: 'socket-a1' })
    capturedCallback(newAlert)

    await waitFor(() => {
      expect(result.current.alerts).toContainEqual(newAlert)
    })
  })

  it('calls the unsubscribe function returned by subscribeAlerts on unmount', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })
    mockFetchAlerts.mockResolvedValue([])

    const mockUnsubscribe = vi.fn()
    mockSubscribeAlerts.mockReturnValue(mockUnsubscribe)

    const { unmount } = renderHook(() => useAlerts())

    await new Promise((r) => setTimeout(r, 0))

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
