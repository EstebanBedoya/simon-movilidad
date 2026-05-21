'use client'

import { useEffect, useRef } from 'react'
import { useConnectivityStore } from '@/stores/connectivity.store'
import { useVehiclesStore } from '@/stores/vehicles.store'
import { useAlertsStore } from '@/stores/alerts.store'
import { useAuthStore } from '@/stores/auth.store'
import { getVehicles } from '@/lib/api/vehicles.api'
import { getAlerts } from '@/lib/api/alerts.api'
import { saveVehicles } from '@/lib/db/vehicles.store'
import { saveAlerts } from '@/lib/db/alerts.store'

export function useOfflineSync() {
  const isOnline = useConnectivityStore((s) => s.isOnline)
  const wasOffline = useRef(false)
  const role = useAuthStore((s) => s.user?.role)

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true
      return
    }

    if (!wasOffline.current) return
    wasOffline.current = false

    getVehicles()
      .then((vehicles) => {
        useVehiclesStore.getState().setVehicles(vehicles)
        if (typeof window !== 'undefined') saveVehicles(vehicles).catch(() => {})
      })
      .catch(() => {})

    if (role === 'admin') {
      getAlerts()
        .then((alerts) => {
          useAlertsStore.getState().setAlerts(alerts)
          if (typeof window !== 'undefined') saveAlerts(alerts).catch(() => {})
        })
        .catch(() => {})
    }
  }, [isOnline, role])
}
