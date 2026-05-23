import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConnectivity } from '@/hooks/use-connectivity'
import { useConnectivityStore } from '@/stores/connectivity.store'

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
})

afterEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// useConnectivity
// ---------------------------------------------------------------------------

describe('useConnectivity — initial state', () => {
  it('returns isOnline=true and wsStatus=LIVE by default', () => {
    const { result } = renderHook(() => useConnectivity())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.wsStatus).toBe('LIVE')
  })

  it('reflects a pre-set offline state from the store', () => {
    useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })

    const { result } = renderHook(() => useConnectivity())

    expect(result.current.isOnline).toBe(false)
    expect(result.current.wsStatus).toBe('DISCONNECTED')
  })
})

describe('useConnectivity — event listeners', () => {
  it('sets isOnline=false when window fires an offline event', () => {
    const { result } = renderHook(() => useConnectivity())

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current.isOnline).toBe(false)
  })

  it('sets isOnline=true when window fires an online event while offline', () => {
    useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })

    const { result } = renderHook(() => useConnectivity())

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current.isOnline).toBe(true)
  })

  it('handles multiple online/offline transitions correctly', () => {
    const { result } = renderHook(() => useConnectivity())

    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(result.current.isOnline).toBe(false)

    act(() => { window.dispatchEvent(new Event('online')) })
    expect(result.current.isOnline).toBe(true)

    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(result.current.isOnline).toBe(false)
  })
})

describe('useConnectivity — cleanup on unmount', () => {
  it('removes the online listener so dispatching online after unmount has no effect', () => {
    const { unmount } = renderHook(() => useConnectivity())
    unmount()

    // Set store offline first, then fire online event — store should NOT update
    useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    // Store should remain offline because the listener was removed
    expect(useConnectivityStore.getState().isOnline).toBe(false)
  })

  it('removes the offline listener so dispatching offline after unmount has no effect', () => {
    const { unmount } = renderHook(() => useConnectivity())
    unmount()

    // Store is online. Fire offline — should NOT update.
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(useConnectivityStore.getState().isOnline).toBe(true)
  })
})
