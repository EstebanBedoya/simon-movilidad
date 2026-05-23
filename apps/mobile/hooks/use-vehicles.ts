import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getVehicles } from '../lib/api/vehicles.api'
import { subscribeTelemetry } from '../lib/socket/telemetry.socket'
import { useVehiclesStore } from '../stores/vehicles.store'
import { queryKeys } from '../lib/api/query-keys'

export function useVehicles() {
  const { setVehicles, updateVehiclePosition, vehicles, isLoading, error } = useVehiclesStore()

  const query = useQuery({
    queryKey: queryKeys.vehicles.all(),
    queryFn: getVehicles,
  })

  useEffect(() => {
    if (query.data) {
      setVehicles(query.data)
    }
  }, [query.data])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    subscribeTelemetry((telemetry) => {
      updateVehiclePosition(telemetry.vehicleId, telemetry)
    }).then((cleanup) => {
      unsubscribe = cleanup
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  return {
    vehicles,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
