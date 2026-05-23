import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTelemetryHistory } from '@/hooks/use-telemetry-history'
import type { TelemetryPage, Telemetry } from '@/types/telemetry.types'

// ---------------------------------------------------------------------------
// Mock the telemetry API
// ---------------------------------------------------------------------------

vi.mock('@/lib/api/telemetry.api', () => ({
  getHistory: vi.fn(),
}))

import { getHistory } from '@/lib/api/telemetry.api'
const mockGetHistory = vi.mocked(getHistory)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTelemetry(overrides: Partial<Telemetry> = {}): Telemetry {
  return {
    id: 'tel-1',
    vehicle_id: 'v1',
    lat: 6.2518,
    lng: -75.5636,
    speed: 45,
    fuel_level: 75,
    temperature: 85,
    timestamp: '2024-06-01T12:00:00.000Z',
    ...overrides,
  }
}

function makePage(overrides: Partial<TelemetryPage> = {}): TelemetryPage {
  return {
    data: [],
    total: 0,
    page: 1,
    limit: 50,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Reset mocks between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('useTelemetryHistory — initial state', () => {
  it('starts with empty data, isLoading=false, and no error', () => {
    mockGetHistory.mockReturnValue(new Promise(() => {})) // never resolves

    const { result } = renderHook(() => useTelemetryHistory('v1'))

    // isLoading transitions to true synchronously after first render
    // but initial state snapshot (before useEffect) has isLoading: false
    expect(result.current.data).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.total).toBe(0)
  })

  it('transitions isLoading to true after the effect fires', async () => {
    mockGetHistory.mockReturnValue(new Promise(() => {})) // never resolves

    const { result } = renderHook(() => useTelemetryHistory('v1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })
  })

  it('does not call getHistory when vehicleId is empty string', () => {
    const { result } = renderHook(() => useTelemetryHistory(''))

    expect(mockGetHistory).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Successful fetch
// ---------------------------------------------------------------------------

describe('useTelemetryHistory — successful fetch', () => {
  it('sets isLoading=false after a successful response', async () => {
    const page = makePage({ data: [makeTelemetry()] })
    mockGetHistory.mockResolvedValue(page)

    const { result } = renderHook(() => useTelemetryHistory('v1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('reverses the data array before storing it', async () => {
    const t1 = makeTelemetry({ id: 'tel-1', timestamp: '2024-06-01T10:00:00.000Z' })
    const t2 = makeTelemetry({ id: 'tel-2', timestamp: '2024-06-01T11:00:00.000Z' })
    const t3 = makeTelemetry({ id: 'tel-3', timestamp: '2024-06-01T12:00:00.000Z' })

    const page = makePage({ data: [t1, t2, t3] })
    mockGetHistory.mockResolvedValue(page)

    const { result } = renderHook(() => useTelemetryHistory('v1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Data should be reversed: [t3, t2, t1]
    expect(result.current.data.map((t) => t.id)).toEqual(['tel-3', 'tel-2', 'tel-1'])
  })

  it('does not mutate the original API response array when reversing', async () => {
    const t1 = makeTelemetry({ id: 'tel-1' })
    const t2 = makeTelemetry({ id: 'tel-2' })
    const originalData = [t1, t2]
    const page = makePage({ data: originalData })
    mockGetHistory.mockResolvedValue(page)

    const { result } = renderHook(() => useTelemetryHistory('v1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Original array should be untouched (slice().reverse())
    expect(originalData.map((t) => t.id)).toEqual(['tel-1', 'tel-2'])
    // Result data is reversed
    expect(result.current.data.map((t) => t.id)).toEqual(['tel-2', 'tel-1'])
  })

  it('stores pagination metadata from the response', async () => {
    const page = makePage({ total: 100, page: 2, limit: 20, data: [] })
    mockGetHistory.mockResolvedValue(page)

    const { result } = renderHook(() =>
      useTelemetryHistory('v1', { page: 2, limit: 20 })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.total).toBe(100)
    expect(result.current.page).toBe(2)
    expect(result.current.limit).toBe(20)
  })

  it('passes vehicleId and params to getHistory', async () => {
    mockGetHistory.mockResolvedValue(makePage())

    renderHook(() => useTelemetryHistory('v99', { page: 3, limit: 10 }))

    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalledWith('v99', { page: 3, limit: 10 })
    })
  })
})

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('useTelemetryHistory — error handling', () => {
  it('sets error state when the API rejects', async () => {
    mockGetHistory.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useTelemetryHistory('v1'))

    await waitFor(() => {
      expect(result.current.error).toBe('Error cargando historial')
    })
  })

  it('sets isLoading=false after an error', async () => {
    mockGetHistory.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useTelemetryHistory('v1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('clears the error on a subsequent successful fetch', async () => {
    mockGetHistory.mockRejectedValueOnce(new Error('fail'))

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useTelemetryHistory(id),
      { initialProps: { id: 'v1' } }
    )

    await waitFor(() => {
      expect(result.current.error).toBe('Error cargando historial')
    })

    // Next fetch succeeds — error should clear
    mockGetHistory.mockResolvedValueOnce(makePage({ data: [] }))

    act(() => {
      rerender({ id: 'v2' })
    })

    await waitFor(() => {
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// Stale / cancellation behaviour
// ---------------------------------------------------------------------------

describe('useTelemetryHistory — stale cancellation', () => {
  it('does not write stale data when vehicleId changes before the first response resolves', async () => {
    let resolveFirst!: (value: TelemetryPage) => void

    const stalePromise = new Promise<TelemetryPage>((resolve) => {
      resolveFirst = resolve
    })

    mockGetHistory
      .mockReturnValueOnce(stalePromise)
      .mockResolvedValueOnce(makePage({ data: [makeTelemetry({ id: 'fresh' })] }))

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useTelemetryHistory(id),
      { initialProps: { id: 'v1' } }
    )

    // Change vehicleId before first promise resolves — this cancels the first request
    act(() => {
      rerender({ id: 'v2' })
    })

    // Wait for second (fresh) request to settle
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const freshIds = result.current.data.map((t) => t.id)
    expect(freshIds).toContain('fresh')

    // Now resolve the stale request — should be ignored (cancelled flag)
    act(() => {
      resolveFirst(makePage({ data: [makeTelemetry({ id: 'stale' })] }))
    })

    // Give a microtask tick
    await new Promise((r) => setTimeout(r, 0))

    // Stale data should not have overwritten the fresh data
    const finalIds = result.current.data.map((t) => t.id)
    expect(finalIds).not.toContain('stale')
  })
})
