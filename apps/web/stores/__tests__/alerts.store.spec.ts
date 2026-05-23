import { describe, it, expect, beforeEach } from 'vitest'
import { useAlertsStore } from '../alerts.store'
import type { Alert } from '@/types/alert.types'

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert-1',
    vehicle_id: 'vehicle-1',
    vehicle_name: 'Vehículo 001',
    type: 'low_fuel',
    message: 'Combustible crítico: autonomía estimada 45 min',
    resolved: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  useAlertsStore.setState({ alerts: [], unresolvedCount: 0 })
})

describe('setAlerts', () => {
  it('replaces alert list and recomputes unresolved count', () => {
    const alerts = [makeAlert({ id: 'a1' }), makeAlert({ id: 'a2', resolved: true })]
    useAlertsStore.getState().setAlerts(alerts)

    const state = useAlertsStore.getState()
    expect(state.alerts).toHaveLength(2)
    expect(state.unresolvedCount).toBe(1)
  })

  it('sets unresolved count to 0 when all alerts are resolved', () => {
    useAlertsStore.getState().setAlerts([makeAlert({ resolved: true })])
    expect(useAlertsStore.getState().unresolvedCount).toBe(0)
  })
})

describe('addAlert', () => {
  it('prepends the new alert to the list', () => {
    useAlertsStore.getState().setAlerts([makeAlert({ id: 'existing' })])
    useAlertsStore.getState().addAlert(makeAlert({ id: 'new' }))

    const { alerts } = useAlertsStore.getState()
    expect(alerts[0].id).toBe('new')
    expect(alerts[1].id).toBe('existing')
  })

  it('increments unresolved count for unresolved alert', () => {
    useAlertsStore.getState().addAlert(makeAlert())
    expect(useAlertsStore.getState().unresolvedCount).toBe(1)
  })

  it('does not increment unresolved count for resolved alert', () => {
    useAlertsStore.getState().addAlert(makeAlert({ resolved: true }))
    expect(useAlertsStore.getState().unresolvedCount).toBe(0)
  })
})

describe('resolveAlert', () => {
  it('marks the alert as resolved and sets resolved_at', () => {
    useAlertsStore.getState().setAlerts([makeAlert({ id: 'a1' })])
    const resolvedAt = new Date().toISOString()
    useAlertsStore.getState().resolveAlert('a1', resolvedAt)

    const alert = useAlertsStore.getState().alerts.find((a) => a.id === 'a1')
    expect(alert?.resolved).toBe(true)
    expect(alert?.resolved_at).toBe(resolvedAt)
  })

  it('decrements unresolved count', () => {
    useAlertsStore.getState().setAlerts([makeAlert({ id: 'a1' }), makeAlert({ id: 'a2' })])
    useAlertsStore.getState().resolveAlert('a1', new Date().toISOString())
    expect(useAlertsStore.getState().unresolvedCount).toBe(1)
  })

  it('does not affect other alerts', () => {
    useAlertsStore.getState().setAlerts([makeAlert({ id: 'a1' }), makeAlert({ id: 'a2' })])
    useAlertsStore.getState().resolveAlert('a1', new Date().toISOString())

    const a2 = useAlertsStore.getState().alerts.find((a) => a.id === 'a2')
    expect(a2?.resolved).toBe(false)
  })
})
