'use client'

import { useConnectivity } from '@/hooks/use-connectivity'
import { useVehicles } from '@/hooks/use-vehicles'
import { useAlerts } from '@/hooks/use-alerts'
import { useOfflineSync } from '@/hooks/use-offline-sync'

export function AppBootstrap() {
  useConnectivity()
  useVehicles()
  useAlerts()
  useOfflineSync()
  return null
}
