'use client'

import { useEffect } from 'react'
import { useConnectivityStore } from '@/stores/connectivity.store'

export function useConnectivity() {
  const { isOnline, wsStatus, setOnline } = useConnectivityStore()

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [setOnline])

  return { isOnline, wsStatus }
}
