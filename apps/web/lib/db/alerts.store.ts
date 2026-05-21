import { openSimonDB } from './idb.client'
import type { Alert } from '@/types/alert.types'

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  const db = await openSimonDB()
  const tx = db.transaction('alerts', 'readwrite')
  await Promise.all(alerts.map((a) => tx.store.put(a)))
  await tx.done
}

export async function getAlerts(): Promise<Alert[]> {
  const db = await openSimonDB()
  return db.getAll('alerts')
}
