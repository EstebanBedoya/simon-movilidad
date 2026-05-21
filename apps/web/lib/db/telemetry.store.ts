import { openSimonDB } from './idb.client'
import type { Telemetry } from '@/types/telemetry.types'

export async function saveTelemetry(records: Telemetry[]): Promise<void> {
  const db = await openSimonDB()
  const tx = db.transaction('telemetry', 'readwrite')
  await Promise.all(records.map((r) => tx.store.put(r)))
  await tx.done
}

export async function getTelemetry(vehicleId: string): Promise<Telemetry[]> {
  const db = await openSimonDB()
  return db.getAllFromIndex('telemetry', 'vehicle_id', vehicleId)
}
