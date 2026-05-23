import { describe, it, expect, beforeEach } from 'vitest'
import { useAlertsStore } from '@/stores/alerts.store'
import type { Alert } from '@/types/alert.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'a1',
    vehicle_id: 'v1',
    vehicle_name: 'Bus 001',
    type: 'low_fuel',
    message: 'Low fuel',
    resolved: false,
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Reset store state between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useAlertsStore.setState({ alerts: [], unresolvedCount: 0 })
})

// ---------------------------------------------------------------------------
// setAlerts
// ---------------------------------------------------------------------------

describe('useAlertsStore — setAlerts', () => {
  it('replaces the alerts array with the provided list', () => {
    const initial = [makeAlert({ id: 'old' })]
    useAlertsStore.getState().setAlerts(initial)

    const replacement = [makeAlert({ id: 'new-1' }), makeAlert({ id: 'new-2' })]
    useAlertsStore.getState().setAlerts(replacement)

    expect(useAlertsStore.getState().alerts).toEqual(replacement)
  })

  it('recomputes unresolvedCount based on the new list', () => {
    const alerts = [
      makeAlert({ id: 'a1', resolved: false }),
      makeAlert({ id: 'a2', resolved: true }),
      makeAlert({ id: 'a3', resolved: false }),
    ]
    useAlertsStore.getState().setAlerts(alerts)

    expect(useAlertsStore.getState().unresolvedCount).toBe(2)
  })

  it('sets unresolvedCount to 0 when all alerts are resolved', () => {
    const alerts = [
      makeAlert({ id: 'a1', resolved: true }),
      makeAlert({ id: 'a2', resolved: true }),
    ]
    useAlertsStore.getState().setAlerts(alerts)

    expect(useAlertsStore.getState().unresolvedCount).toBe(0)
  })

  it('sets unresolvedCount to array length when all alerts are unresolved', () => {
    const alerts = [makeAlert({ id: 'a1' }), makeAlert({ id: 'a2' })]
    useAlertsStore.getState().setAlerts(alerts)

    expect(useAlertsStore.getState().unresolvedCount).toBe(2)
  })

  it('handles an empty array gracefully', () => {
    useAlertsStore.getState().setAlerts([])

    const state = useAlertsStore.getState()
    expect(state.alerts).toEqual([])
    expect(state.unresolvedCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// addAlert
// ---------------------------------------------------------------------------

describe('useAlertsStore — addAlert', () => {
  it('prepends the new alert to the existing list', () => {
    const existing = makeAlert({ id: 'existing' })
    useAlertsStore.setState({ alerts: [existing], unresolvedCount: 1 })

    const incoming = makeAlert({ id: 'incoming' })
    useAlertsStore.getState().addAlert(incoming)

    const { alerts } = useAlertsStore.getState()
    expect(alerts[0].id).toBe('incoming')
    expect(alerts[1].id).toBe('existing')
  })

  it('does NOT append — new alert is always first', () => {
    useAlertsStore.getState().addAlert(makeAlert({ id: 'first' }))
    useAlertsStore.getState().addAlert(makeAlert({ id: 'second' }))

    expect(useAlertsStore.getState().alerts[0].id).toBe('second')
  })

  it('increments unresolvedCount when the added alert is unresolved', () => {
    useAlertsStore.setState({ alerts: [], unresolvedCount: 0 })
    useAlertsStore.getState().addAlert(makeAlert({ id: 'a1', resolved: false }))

    expect(useAlertsStore.getState().unresolvedCount).toBe(1)
  })

  it('does not increment unresolvedCount when the added alert is already resolved', () => {
    useAlertsStore.setState({ alerts: [], unresolvedCount: 0 })
    useAlertsStore.getState().addAlert(makeAlert({ id: 'a1', resolved: true }))

    expect(useAlertsStore.getState().unresolvedCount).toBe(0)
  })

  it('preserves existing alerts when adding a new one', () => {
    const existing = [makeAlert({ id: 'e1' }), makeAlert({ id: 'e2' })]
    useAlertsStore.setState({ alerts: existing, unresolvedCount: 2 })

    useAlertsStore.getState().addAlert(makeAlert({ id: 'new' }))

    expect(useAlertsStore.getState().alerts).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// resolveAlert
// ---------------------------------------------------------------------------

describe('useAlertsStore — resolveAlert', () => {
  it('sets resolved to true on the matching alert', () => {
    const alerts = [makeAlert({ id: 'a1', resolved: false })]
    useAlertsStore.setState({ alerts, unresolvedCount: 1 })

    useAlertsStore.getState().resolveAlert('a1', '2024-06-01T12:00:00.000Z')

    expect(useAlertsStore.getState().alerts[0].resolved).toBe(true)
  })

  it('sets resolved_at on the matching alert', () => {
    const resolvedAt = '2024-06-01T12:00:00.000Z'
    const alerts = [makeAlert({ id: 'a1', resolved: false })]
    useAlertsStore.setState({ alerts, unresolvedCount: 1 })

    useAlertsStore.getState().resolveAlert('a1', resolvedAt)

    expect(useAlertsStore.getState().alerts[0].resolved_at).toBe(resolvedAt)
  })

  it('decrements unresolvedCount after resolving an alert', () => {
    const alerts = [
      makeAlert({ id: 'a1', resolved: false }),
      makeAlert({ id: 'a2', resolved: false }),
    ]
    useAlertsStore.setState({ alerts, unresolvedCount: 2 })

    useAlertsStore.getState().resolveAlert('a1', '2024-06-01T12:00:00.000Z')

    expect(useAlertsStore.getState().unresolvedCount).toBe(1)
  })

  it('does not affect other alerts when resolving one', () => {
    const alerts = [
      makeAlert({ id: 'a1', resolved: false }),
      makeAlert({ id: 'a2', resolved: false }),
    ]
    useAlertsStore.setState({ alerts, unresolvedCount: 2 })

    useAlertsStore.getState().resolveAlert('a1', '2024-06-01T12:00:00.000Z')

    const { alerts: updated } = useAlertsStore.getState()
    expect(updated.find((a) => a.id === 'a2')?.resolved).toBe(false)
  })

  it('does not change state when the id does not match any alert', () => {
    const alerts = [makeAlert({ id: 'a1', resolved: false })]
    useAlertsStore.setState({ alerts, unresolvedCount: 1 })

    useAlertsStore.getState().resolveAlert('does-not-exist', '2024-06-01T12:00:00.000Z')

    const state = useAlertsStore.getState()
    expect(state.alerts[0].resolved).toBe(false)
    expect(state.unresolvedCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// unresolvedCount derivation
// ---------------------------------------------------------------------------

describe('useAlertsStore — unresolvedCount accuracy', () => {
  it('counts only alerts where resolved is false', () => {
    const alerts = [
      makeAlert({ id: 'a1', resolved: false }),
      makeAlert({ id: 'a2', resolved: true }),
      makeAlert({ id: 'a3', resolved: false }),
      makeAlert({ id: 'a4', resolved: true }),
    ]
    useAlertsStore.getState().setAlerts(alerts)

    expect(useAlertsStore.getState().unresolvedCount).toBe(2)
  })
})
