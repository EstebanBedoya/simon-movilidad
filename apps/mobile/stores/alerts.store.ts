import { create } from 'zustand'
import type { Alert } from '@simon/types'

interface AlertsState {
  alerts: Alert[]
}

interface AlertsActions {
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  resolveAlert: (id: string, resolved_at: string) => void
}

export const useAlertsStore = create<AlertsState & AlertsActions>()((set) => ({
  alerts: [],

  setAlerts: (alerts) => set({ alerts }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: state.alerts.some((a) => a.id === alert.id)
        ? state.alerts
        : [alert, ...state.alerts],
    })),

  resolveAlert: (id, resolved_at) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, resolved: true, resolved_at } : a
      ),
    })),
}))
