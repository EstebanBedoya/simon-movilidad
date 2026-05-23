import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useOfflineSync } from '@/hooks/use-offline-sync'
import { useConnectivityStore } from '@/stores/connectivity.store'
import { useVehiclesStore } from '@/stores/vehicles.store'
import { useAlertsStore } from '@/stores/alerts.store'
import { useAuthStore } from '@/stores/auth.store'
import type { Vehicle } from '@/types/vehicle.types'
import type { Alert } from '@/types/alert.types'
import type { AuthUser } from '@/types/auth.types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/api/vehicles.api', () => ({
  getVehicles: vi.fn(),
}))

vi.mock('@/lib/api/alerts.api', () => ({
  getAlerts: vi.fn(),
}))

vi.mock('@/lib/db/vehicles.store', () => ({
  saveVehicles: vi.fn().mockResolvedValue(undefined),
  getVehicles: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/db/alerts.store', () => ({
  saveAlerts: vi.fn().mockResolvedValue(undefined),
  getAlerts: vi.fn().mockResolvedValue([]),
}))

import { getVehicles } from '@/lib/api/vehicles.api'
import { getAlerts } from '@/lib/api/alerts.api'
import { saveVehicles } from '@/lib/db/vehicles.store'
import { saveAlerts } from '@/lib/db/alerts.store'

const mockGetVehicles = vi.mocked(getVehicles)
const mockGetAlerts = vi.mocked(getAlerts)
const mockSaveVehicles = vi.mocked(saveVehicles)
const mockSaveAlerts = vi.mocked(saveAlerts)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v1',
    device_id: 'dev-1',
    name: 'Bus 001',
    city: 'medellin',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

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
  useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
  useVehiclesStore.setState({ vehicles: [], isLoading: false, error: null })
  useAlertsStore.setState({ alerts: [], unresolvedCount: 0 })
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  mockGetVehicles.mockResolvedValue([])
  mockGetAlerts.mockResolvedValue([])
  mockSaveVehicles.mockResolvedValue(undefined)
  mockSaveAlerts.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Initial mount while online — no prior offline
// ---------------------------------------------------------------------------

describe('useOfflineSync — initial mount while online', () => {
  it('does NOT re-fetch on first mount when already online (wasOffline starts false)', async () => {
    // wasOffline.current starts as false → the guard `if (!wasOffline.current) return` fires
    renderHook(() => useOfflineSync())

    await new Promise((r) => setTimeout(r, 20))

    expect(mockGetVehicles).not.toHaveBeenCalled()
  })

  it('does NOT fetch alerts on first mount when already online', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })

    renderHook(() => useOfflineSync())

    await new Promise((r) => setTimeout(r, 20))

    expect(mockGetAlerts).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Going offline → sets wasOffline flag
// ---------------------------------------------------------------------------

describe('useOfflineSync — going offline', () => {
  it('does not fetch when transitioning to offline', async () => {
    renderHook(() => useOfflineSync())

    act(() => {
      useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    })

    await new Promise((r) => setTimeout(r, 20))

    expect(mockGetVehicles).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Online → Offline → Online: triggers re-fetch
// ---------------------------------------------------------------------------

describe('useOfflineSync — online→offline→online transition', () => {
  it('re-fetches vehicles when coming back online after being offline', async () => {
    const freshVehicle = makeVehicle({ id: 'fresh-v1' })
    mockGetVehicles.mockResolvedValue([freshVehicle])

    renderHook(() => useOfflineSync())

    // Simulate going offline
    act(() => {
      useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    })

    // Simulate coming back online
    act(() => {
      useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
    })

    await waitFor(() => {
      expect(mockGetVehicles).toHaveBeenCalledTimes(1)
    })
  })

  it('updates the vehicles store after coming back online', async () => {
    const freshVehicle = makeVehicle({ id: 'synced-v1' })
    mockGetVehicles.mockResolvedValue([freshVehicle])

    renderHook(() => useOfflineSync())

    act(() => {
      useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    })

    act(() => {
      useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
    })

    await waitFor(() => {
      expect(useVehiclesStore.getState().vehicles).toContainEqual(freshVehicle)
    })
  })

  it('saves vehicles to IDB after sync', async () => {
    const freshVehicle = makeVehicle({ id: 'v-to-save' })
    mockGetVehicles.mockResolvedValue([freshVehicle])

    renderHook(() => useOfflineSync())

    act(() => {
      useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    })

    act(() => {
      useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
    })

    await waitFor(() => {
      expect(mockSaveVehicles).toHaveBeenCalledWith([freshVehicle])
    })
  })

  it('re-fetches alerts when admin comes back online', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })

    const freshAlert = makeAlert({ id: 'synced-a1' })
    mockGetVehicles.mockResolvedValue([])
    mockGetAlerts.mockResolvedValue([freshAlert])

    renderHook(() => useOfflineSync())

    act(() => {
      useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    })

    act(() => {
      useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
    })

    await waitFor(() => {
      expect(mockGetAlerts).toHaveBeenCalledTimes(1)
    })
  })

  it('updates alerts store when admin comes back online', async () => {
    useAuthStore.setState({ user: makeAdminUser(), token: 't', isAuthenticated: true })

    const freshAlert = makeAlert({ id: 'synced-a1' })
    mockGetVehicles.mockResolvedValue([])
    mockGetAlerts.mockResolvedValue([freshAlert])

    renderHook(() => useOfflineSync())

    act(() => {
      useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    })

    act(() => {
      useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
    })

    await waitFor(() => {
      expect(useAlertsStore.getState().alerts).toContainEqual(freshAlert)
    })
  })

  it('does NOT fetch alerts when non-admin comes back online', async () => {
    useAuthStore.setState({ user: makeRegularUser(), token: 't', isAuthenticated: true })
    mockGetVehicles.mockResolvedValue([])

    renderHook(() => useOfflineSync())

    act(() => {
      useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    })

    act(() => {
      useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
    })

    await waitFor(() => {
      expect(mockGetVehicles).toHaveBeenCalledTimes(1)
    })

    expect(mockGetAlerts).not.toHaveBeenCalled()
  })

  it('calls markSynced after all tasks settle', async () => {
    mockGetVehicles.mockResolvedValue([])

    const markSynced = vi.fn()
    useConnectivityStore.setState({
      isOnline: true,
      wsStatus: 'LIVE',
      lastSyncAt: null,
      markSynced,
    } as Parameters<typeof useConnectivityStore.setState>[0])

    renderHook(() => useOfflineSync())

    // Simulate going offline then online
    act(() => {
      useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    })

    // Restore markSynced spy — setState above without it would lose the spy
    useConnectivityStore.setState((s) => ({ ...s, markSynced }))

    act(() => {
      useConnectivityStore.setState((s) => ({ ...s, isOnline: true, wsStatus: 'LIVE' }))
    })

    await waitFor(() => {
      expect(markSynced).toHaveBeenCalled()
    })
  })

  it('does not fetch a second time if coming online again without going offline first', async () => {
    mockGetVehicles.mockResolvedValue([])

    renderHook(() => useOfflineSync())

    // Go offline, then online (1st sync)
    act(() => {
      useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    })

    act(() => {
      useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
    })

    await waitFor(() => {
      expect(mockGetVehicles).toHaveBeenCalledTimes(1)
    })

    // Trigger isOnline change again while still online (wasOffline is now false)
    act(() => {
      useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: Date.now() })
    })

    await new Promise((r) => setTimeout(r, 20))

    // Should still be exactly 1 call
    expect(mockGetVehicles).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Error resilience
// ---------------------------------------------------------------------------

describe('useOfflineSync — error resilience', () => {
  it('does not throw when vehicles fetch fails during re-sync', async () => {
    mockGetVehicles.mockRejectedValue(new Error('Network error'))

    renderHook(() => useOfflineSync())

    act(() => {
      useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    })

    expect(() => {
      act(() => {
        useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
      })
    }).not.toThrow()

    await new Promise((r) => setTimeout(r, 30))
  })
})
