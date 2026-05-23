import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAlerts } from '../lib/api/alerts.api'
import { subscribeAlerts } from '../lib/socket/alerts.socket'
import { useAlertsStore } from '../stores/alerts.store'
import { queryKeys } from '../lib/api/query-keys'

export function useAlerts(params?: { resolved?: boolean; type?: string }) {
  const { setAlerts, addAlert, alerts } = useAlertsStore()

  const query = useQuery({
    queryKey: queryKeys.alerts.all(params),
    queryFn: () => getAlerts(params),
  })

  useEffect(() => {
    if (query.data) {
      setAlerts(query.data)
    }
  }, [query.data])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    subscribeAlerts((alert) => {
      addAlert(alert)
    }).then((cleanup) => {
      unsubscribe = cleanup
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  return {
    alerts,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
