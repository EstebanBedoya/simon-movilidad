'use client'

import { useEffect } from 'react'
import { useVehiclesStore } from '@/stores/vehicles.store'
import { useConnectivityStore } from '@/stores/connectivity.store'
import { getVehicles as fetchVehicles } from '@/lib/api/vehicles.api'
import { subscribeTelemetry } from '@/lib/socket/telemetry.socket'
import {
  getVehicles as idbGetVehicles,
  saveVehicles as idbSaveVehicles,
} from '@/lib/db/vehicles.store'

export function useVehicles() {
  const { vehicles, isLoading, error, setVehicles, updateVehiclePosition, setLoading, setError } =
    useVehiclesStore()
  const isOnline = useConnectivityStore((s) => s.isOnline)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await fetchVehicles()
        if (!cancelled) {
          setVehicles(data)
          setError(null)
          if (typeof window !== 'undefined') {
            idbSaveVehicles(data).catch(() => {})
          }
        }
      } catch {
        if (!cancelled && typeof window !== 'undefined') {
          try {
            const cached = await idbGetVehicles()
            if (!cancelled) setVehicles(cached)
          } catch {
            if (!cancelled) setError('Error cargando vehículos')
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (isOnline) load()
    else if (typeof window !== 'undefined') {
      idbGetVehicles()
        .then((cached) => {
          if (!cancelled) {
            setVehicles(cached)
            setLoading(false)
          }
        })
        .catch(() => setLoading(false))
    }

    const unsubscribe = subscribeTelemetry((telemetry) => {
      updateVehiclePosition(telemetry.vehicle_id, telemetry)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [isOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  return { vehicles, isLoading, error }
}
