import { openSimonDB } from './idb.client'
import type { Vehicle } from '@/types/vehicle.types'

export async function saveVehicles(vehicles: Vehicle[]): Promise<void> {
  const db = await openSimonDB()
  const tx = db.transaction('vehicles', 'readwrite')
  await Promise.all(vehicles.map((v) => tx.store.put(v)))
  await tx.done
}

export async function getVehicles(): Promise<Vehicle[]> {
  const db = await openSimonDB()
  return db.getAll('vehicles')
}
