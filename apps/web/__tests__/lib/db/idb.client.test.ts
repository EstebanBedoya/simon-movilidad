import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// The dbPromise singleton lives at module scope.
// We reset modules + replace the global indexedDB each time so each test
// starts with a clean state and a fresh singleton.
beforeEach(async () => {
  vi.resetModules()
  const { IDBFactory } = await import('fake-indexeddb')
  // @ts-expect-error replacing global indexedDB with a fresh instance
  globalThis.indexedDB = new IDBFactory()
})

describe('openSimonDB — singleton', () => {
  it('returns the same promise on every call', async () => {
    const { openSimonDB } = await import('@/lib/db/idb.client')

    const p1 = openSimonDB()
    const p2 = openSimonDB()

    expect(p1).toBe(p2)
  })
})

describe('openSimonDB — schema', () => {
  it('creates vehicles, telemetry, and alerts object stores', async () => {
    const { openSimonDB } = await import('@/lib/db/idb.client')
    const db = await openSimonDB()

    const storeNames = Array.from(db.objectStoreNames)
    expect(storeNames).toContain('vehicles')
    expect(storeNames).toContain('telemetry')
    expect(storeNames).toContain('alerts')
  })

  it('creates a vehicle_id index on the telemetry store', async () => {
    const { openSimonDB } = await import('@/lib/db/idb.client')
    const db = await openSimonDB()

    const tx = db.transaction('telemetry', 'readonly')
    const indexNames = Array.from(tx.store.indexNames)
    expect(indexNames).toContain('vehicle_id')
  })
})
