import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useConnectivityStore } from '@/stores/connectivity.store'

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
})

// ---------------------------------------------------------------------------
// setOnline
// ---------------------------------------------------------------------------

describe('useConnectivityStore — setOnline', () => {
  it('sets isOnline to true', () => {
    useConnectivityStore.setState({ isOnline: false, wsStatus: 'LIVE', lastSyncAt: null })
    useConnectivityStore.getState().setOnline(true)

    expect(useConnectivityStore.getState().isOnline).toBe(true)
  })

  it('sets isOnline to false', () => {
    useConnectivityStore.getState().setOnline(false)

    expect(useConnectivityStore.getState().isOnline).toBe(false)
  })

  it('updates lastSyncAt when transitioning from offline to online', () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    useConnectivityStore.setState({ isOnline: false, wsStatus: 'RECONNECTING', lastSyncAt: null })
    useConnectivityStore.getState().setOnline(true)

    expect(useConnectivityStore.getState().lastSyncAt).toBe(now)
    vi.restoreAllMocks()
  })

  it('does NOT update lastSyncAt when already online and setOnline(true) is called', () => {
    useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: 12345 })
    useConnectivityStore.getState().setOnline(true)

    // was already online → no sync timestamp update
    expect(useConnectivityStore.getState().lastSyncAt).toBe(12345)
  })

  it('does NOT update lastSyncAt when going offline', () => {
    useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: 12345 })
    useConnectivityStore.getState().setOnline(false)

    expect(useConnectivityStore.getState().lastSyncAt).toBe(12345)
  })
})

// ---------------------------------------------------------------------------
// setWsStatus
// ---------------------------------------------------------------------------

describe('useConnectivityStore — setWsStatus', () => {
  it('sets wsStatus to LIVE', () => {
    useConnectivityStore.setState({ isOnline: true, wsStatus: 'DISCONNECTED', lastSyncAt: null })
    useConnectivityStore.getState().setWsStatus('LIVE')

    expect(useConnectivityStore.getState().wsStatus).toBe('LIVE')
  })

  it('sets wsStatus to RECONNECTING', () => {
    useConnectivityStore.getState().setWsStatus('RECONNECTING')

    expect(useConnectivityStore.getState().wsStatus).toBe('RECONNECTING')
  })

  it('sets wsStatus to DISCONNECTED', () => {
    useConnectivityStore.getState().setWsStatus('DISCONNECTED')

    expect(useConnectivityStore.getState().wsStatus).toBe('DISCONNECTED')
  })

  it('does not affect isOnline when changing wsStatus', () => {
    useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: null })
    useConnectivityStore.getState().setWsStatus('DISCONNECTED')

    expect(useConnectivityStore.getState().isOnline).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// markSynced
// ---------------------------------------------------------------------------

describe('useConnectivityStore — markSynced', () => {
  it('updates lastSyncAt to the current timestamp', () => {
    const now = 1_700_000_001_000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    useConnectivityStore.getState().markSynced()

    expect(useConnectivityStore.getState().lastSyncAt).toBe(now)
    vi.restoreAllMocks()
  })

  it('overwrites a previous lastSyncAt value', () => {
    useConnectivityStore.setState({ isOnline: true, wsStatus: 'LIVE', lastSyncAt: 999 })

    const later = 1_700_000_002_000
    vi.spyOn(Date, 'now').mockReturnValue(later)
    useConnectivityStore.getState().markSynced()

    expect(useConnectivityStore.getState().lastSyncAt).toBe(later)
    vi.restoreAllMocks()
  })
})
