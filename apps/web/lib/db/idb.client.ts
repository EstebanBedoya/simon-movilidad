import { openDB as idbOpenDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'simon-movilidad'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

export function openSimonDB(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = idbOpenDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('vehicles')) {
        db.createObjectStore('vehicles', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('telemetry')) {
        const ts = db.createObjectStore('telemetry', { keyPath: 'id' })
        ts.createIndex('vehicle_id', 'vehicle_id')
      }
      if (!db.objectStoreNames.contains('alerts')) {
        db.createObjectStore('alerts', { keyPath: 'id' })
      }
    },
  })
  return dbPromise
}
