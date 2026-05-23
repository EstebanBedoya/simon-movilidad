import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useVehicles } from '@/hooks/use-vehicles'
import { useVehiclesStore } from '@/stores/vehicles.store'
import { useConnectivityStore } from '@/stores/connectivity.store'
import type { Vehicle } from '@/types/vehicle.types'
import type { Telemetry } from '@/types/telemetry.types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/api/vehicles.api', () => ({
  getVehicles: vi.fn(),
}))

vi.mock('@/lib/db/vehicles.store', () => ({
  saveVehicles: vi.fn().mockResolvedValue(undefined),
  getVehicles: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/socket/telemetry.socket', () => ({
  subscribeTelemetry: vi.fn(() => vi.fn()),
}))

import { getVehicles as fetchVehicles } from '@/lib/api/vehicles.api'
import {
  getVehicles as idbGetVehicles,
  saveVehicles as idbSaveVehicles,
} from '@/lib/db/vehicles.store'
import { subscribeTelemetry } from '@/lib/socket/telemetry.socket'

const mockFetchVehicles = vi.mocked(fetchVehicles)
const mockIdbGetVehicles = vi.mocked(idbGetVehicles)
const mockIdbSaveVehicles = vi.mocked(idbSaveVehicles)
const mockSubscribeTelemetry = vi.mocked(subscribeTelemetry)

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

function makeTelemetry(overrides: Partial<Telemetry> = {}): Telemetry & { vehicleId: string } {
  return {
    vehicle_id: 'v1',
    vehicleId: 'v1',
    lat: 6.2518,
    lng: -75.5636,
    speed: 60,
    fuel_level: 80,
    temperature: 85,
    timestamp: '2024-06-01T12:00:00.000Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Reset state between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  useVehiclesStore.setState({ vehicles: [], isLoading: false, error: null })
  useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
  mockSubscribeTelemetry.mockReturnValue(vi.fn())
  mockIdbGetVehicles.mockResolvedValue([])
  mockIdbSaveVehicles.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Online: fetch, store, and save to IDB
// ---------------------------------------------------------------------------

describe('useVehicles — online, fetch success', () => {
  it('fetches vehicles and updates the store', async () => {
    const vehicle = makeVehicle()
    mockFetchVehicles.mockResolvedValue([vehicle])

    const { result } = renderHook(() => useVehicles())

    await waitFor(() => {
      expect(result.current.vehicles).toEqual([vehicle])
    })
  })

  it('saves fetched vehicles to IDB', async () => {
    const vehicle = makeVehicle()
    mockFetchVehicles.mockResolvedValue([vehicle])

    renderHook(() => useVehicles())

    await waitFor(() => {
      expect(mockIdbSaveVehicles).toHaveBeenCalledWith([vehicle])
    })
  })

  it('sets isLoading=false after fetch completes', async () => {
    mockFetchVehicles.mockResolvedValue([])

    const { result } = renderHook(() => useVehicles())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('clears any previous error on a successful fetch', async () => {
    useVehiclesStore.setState({ vehicles: [], isLoading: false, error: 'previous error' })
    mockFetchVehicles.mockResolvedValue([])

    const { result } = renderHook(() => useVehicles())

    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// Online: API error falls back to IDB
// ---------------------------------------------------------------------------

describe('useVehicles — online, fetch error', () => {
  it('falls back to IDB vehicles when fetch fails', async () => {
    const cached = makeVehicle({ id: 'cached-v1', name: 'Cached Bus' })
    mockFetchVehicles.mockRejectedValue(new Error('Network error'))
    mockIdbGetVehicles.mockResolvedValue([cached])

    const { result } = renderHook(() => useVehicles())

    await waitFor(() => {
      expect(result.current.vehicles).toEqual([cached])
    })
  })

  it('sets error message when both fetch and IDB fail', async () => {
    mockFetchVehicles.mockRejectedValue(new Error('Network error'))
    mockIdbGetVehicles.mockRejectedValue(new Error('IDB error'))

    const { result } = renderHook(() => useVehicles())

    await waitFor(() => {
      expect(result.current.error).toBe('Error cargando vehículos')
    })
  })

  it('sets isLoading=false even when both fetch and IDB fail', async () => {
    mockFetchVehicles.mockRejectedValue(new Error('Network error'))
    mockIdbGetVehicles.mockRejectedValue(new Error('IDB error'))

    const { result } = renderHook(() => useVehicles())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// Offline: read from IDB directly
// ---------------------------------------------------------------------------

describe('useVehicles — offline', () => {
  it('reads from IDB directly when offline', async () => {
    useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })

    const cached = makeVehicle({ id: 'idb-v1' })
    mockIdbGetVehicles.mockResolvedValue([cached])

    const { result } = renderHook(() => useVehicles())

    await waitFor(() => {
      expect(result.current.vehicles).toEqual([cached])
    })
  })

  it('does not call fetchVehicles when offline', async () => {
    useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    mockIdbGetVehicles.mockResolvedValue([])

    renderHook(() => useVehicles())

    await new Promise((r) => setTimeout(r, 20))

    expect(mockFetchVehicles).not.toHaveBeenCalled()
  })

  it('sets isLoading=false after reading IDB while offline', async () => {
    useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    mockIdbGetVehicles.mockResolvedValue([])

    const { result } = renderHook(() => useVehicles())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// Socket subscription — telemetry updates
// ---------------------------------------------------------------------------

describe('useVehicles — socket telemetry subscription', () => {
  it('subscribes to telemetry socket on mount', async () => {
    mockFetchVehicles.mockResolvedValue([])

    renderHook(() => useVehicles())

    await new Promise((r) => setTimeout(r, 0))

    expect(mockSubscribeTelemetry).toHaveBeenCalled()
  })

  it('updates vehicle position when a telemetry event arrives', async () => {
    const vehicle = makeVehicle({ id: 'v1' })
    mockFetchVehicles.mockResolvedValue([vehicle])

    let capturedCallback!: (telemetry: Telemetry & { vehicleId: string }) => void
    mockSubscribeTelemetry.mockImplementation((cb) => {
      capturedCallback = cb
      return vi.fn()
    })

    const { result } = renderHook(() => useVehicles())

    await waitFor(() => {
      expect(result.current.vehicles).toContainEqual(vehicle)
    })

    const telemetryUpdate = makeTelemetry({ vehicle_id: 'v1', speed: 99 })
    capturedCallback(telemetryUpdate)

    await waitFor(() => {
      const updatedVehicle = result.current.vehicles.find((v) => v.id === 'v1')
      expect(updatedVehicle?.latest_telemetry?.speed).toBe(99)
    })
  })

  it('calls the unsubscribe function on unmount', async () => {
    mockFetchVehicles.mockResolvedValue([])

    const mockUnsubscribe = vi.fn()
    mockSubscribeTelemetry.mockReturnValue(mockUnsubscribe)

    const { unmount } = renderHook(() => useVehicles())

    await new Promise((r) => setTimeout(r, 0))

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Stale closure: unmount mid-async
// ---------------------------------------------------------------------------

describe('useVehicles — stale closure on unmount', () => {
  it('does not update the store if the component unmounts before fetch resolves', async () => {
    let resolveFetch!: (value: Vehicle[]) => void
    const pendingFetch = new Promise<Vehicle[]>((resolve) => {
      resolveFetch = resolve
    })

    mockFetchVehicles.mockReturnValue(pendingFetch)

    const { unmount } = renderHook(() => useVehicles())

    // Unmount before the fetch resolves
    unmount()

    // Now resolve the fetch with data
    resolveFetch([makeVehicle({ id: 'should-not-appear' })])

    // Give microtasks time to run
    await new Promise((r) => setTimeout(r, 20))

    // Store should remain empty
    expect(useVehiclesStore.getState().vehicles).toEqual([])
  })
})
