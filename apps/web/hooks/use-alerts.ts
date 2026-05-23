'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAlertsStore } from '@/stores/alerts.store'
import { useAuthStore } from '@/stores/auth.store'
import { useConnectivityStore } from '@/stores/connectivity.store'
import { getAlerts as fetchAlerts } from '@/lib/api/alerts.api'
import { subscribeAlerts } from '@/lib/socket/alerts.socket'
import {
  getAlerts as idbGetAlerts,
  saveAlerts as idbSaveAlerts,
} from '@/lib/db/alerts.store'
import type { AlertType } from '@/types/alert.types'

const ALERT_LABELS: Record<AlertType, string> = {
  low_fuel: 'Combustible crítico',
  high_temperature: 'Temperatura crítica',
  speeding: 'Exceso de velocidad',
  offline: 'Vehículo sin señal',
}

export function useAlerts() {
  const { alerts, unresolvedCount, setAlerts, addAlert } = useAlertsStore()
  const role = useAuthStore((s) => s.user?.role)
  const isOnline = useConnectivityStore((s) => s.isOnline)

  useEffect(() => {
    if (role !== 'admin') return

    let cancelled = false

    async function load() {
      try {
        const data = await fetchAlerts()
        if (!cancelled) {
          setAlerts(data)
          if (typeof window !== 'undefined') {
            idbSaveAlerts(data).catch(() => {})
          }
        }
      } catch {
        if (!cancelled && typeof window !== 'undefined') {
          try {
            const cached = await idbGetAlerts()
            if (!cancelled) setAlerts(cached)
          } catch {}
        }
      }
    }

    if (isOnline) load()
    else if (typeof window !== 'undefined') {
      idbGetAlerts()
        .then((cached) => {
          if (!cancelled) setAlerts(cached)
        })
        .catch(() => {})
    }

    const unsubscribe = subscribeAlerts((alert) => {
      addAlert(alert)
      toast.warning(`${ALERT_LABELS[alert.type]} — ${alert.vehicle_name}`, {
        description: alert.message,
      })
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [role, isOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  return { alerts, unresolvedCount }
}
