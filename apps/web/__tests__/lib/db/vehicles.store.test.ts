import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Vehicle } from '@/types/vehicle.types'

beforeEach(async () => {
  vi.resetModules()
  const { IDBFactory } = await import('fake-indexeddb')
  // @ts-expect-error replacing global indexedDB with a fresh instance
  globalThis.indexedDB = new IDBFactory()
})

const mockVehicle: Vehicle = {
  id: 'v1',
  device_id: 'dev-001',
  name: 'Bus 01',
  city: 'medellin',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
}

describe('saveVehicles + getVehicles', () => {
  it('round-trips a single vehicle correctly', async () => {
    const { saveVehicles, getVehicles } = await import('@/lib/db/vehicles.store')

    await saveVehicles([mockVehicle])
    const result = await getVehicles()

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(mockVehicle)
  })

  it('round-trips multiple vehicles correctly', async () => {
    const { saveVehicles, getVehicles } = await import('@/lib/db/vehicles.store')

    const v2: Vehicle = { ...mockVehicle, id: 'v2', name: 'Bus 02' }
    await saveVehicles([mockVehicle, v2])
    const result = await getVehicles()

    expect(result).toHaveLength(2)
    const ids = result.map((v) => v.id)
    expect(ids).toContain('v1')
    expect(ids).toContain('v2')
  })

  it('returns an empty array when no vehicles are stored', async () => {
    const { getVehicles } = await import('@/lib/db/vehicles.store')

    const result = await getVehicles()

    expect(result).toEqual([])
  })

  it('put overwrites an existing vehicle with the same id', async () => {
    const { saveVehicles, getVehicles } = await import('@/lib/db/vehicles.store')

    await saveVehicles([mockVehicle])
    await saveVehicles([{ ...mockVehicle, name: 'Bus 01 Updated' }])
    const result = await getVehicles()

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Bus 01 Updated')
  })
})
