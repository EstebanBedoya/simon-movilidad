import { create } from 'zustand'
import type { Alert } from '@/types/alert.types'

interface AlertsState {
  alerts: Alert[]
  unresolvedCount: number
}

interface AlertsActions {
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  resolveAlert: (id: string, resolvedAt: string) => void
}

function countUnresolved(alerts: Alert[]): number {
  return alerts.filter((a) => !a.resolved).length
}

export const useAlertsStore = create<AlertsState & AlertsActions>()((set) => ({
  alerts: [],
  unresolvedCount: 0,
  setAlerts: (alerts) => set({ alerts, unresolvedCount: countUnresolved(alerts) }),
  addAlert: (alert) =>
    set((state) => {
      const alerts = [alert, ...state.alerts]
      return { alerts, unresolvedCount: countUnresolved(alerts) }
    }),
  resolveAlert: (id, resolvedAt) =>
    set((state) => {
      const alerts = state.alerts.map((a) =>
        a.id === id ? { ...a, resolved: true, resolved_at: resolvedAt } : a
      )
      return { alerts, unresolvedCount: countUnresolved(alerts) }
    }),
}))
