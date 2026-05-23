import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Telemetry } from '@/types/telemetry.types'

beforeEach(async () => {
  vi.resetModules()
  const { IDBFactory } = await import('fake-indexeddb')
  // @ts-expect-error replacing global indexedDB with a fresh instance
  globalThis.indexedDB = new IDBFactory()
})

const makeTelemetry = (overrides: Partial<Telemetry> & { id: string; vehicle_id: string }): Telemetry => ({
  lat: 6.2,
  lng: -75.5,
  speed: 40,
  fuel_level: 75,
  temperature: 23,
  timestamp: '2024-01-01T10:00:00Z',
  ...overrides,
})

describe('saveTelemetry + getTelemetry', () => {
  it('round-trips records for a single vehicle', async () => {
    const { saveTelemetry, getTelemetry } = await import('@/lib/db/telemetry.store')

    const record = makeTelemetry({ id: 't1', vehicle_id: 'v1' })
    await saveTelemetry([record])
    const result = await getTelemetry('v1')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(record)
  })

  it('returns only records matching the queried vehicleId', async () => {
    const { saveTelemetry, getTelemetry } = await import('@/lib/db/telemetry.store')

    const r1 = makeTelemetry({ id: 't1', vehicle_id: 'v1' })
    const r2 = makeTelemetry({ id: 't2', vehicle_id: 'v2' })
    const r3 = makeTelemetry({ id: 't3', vehicle_id: 'v1', speed: 60 })

    await saveTelemetry([r1, r2, r3])

    const v1Records = await getTelemetry('v1')
    expect(v1Records).toHaveLength(2)
    expect(v1Records.every((r) => r.vehicle_id === 'v1')).toBe(true)
  })

  it('does not return records from other vehicles', async () => {
    const { saveTelemetry, getTelemetry } = await import('@/lib/db/telemetry.store')

    const r1 = makeTelemetry({ id: 't1', vehicle_id: 'v1' })
    const r2 = makeTelemetry({ id: 't2', vehicle_id: 'v2' })

    await saveTelemetry([r1, r2])

    const v2Records = await getTelemetry('v2')
    expect(v2Records).toHaveLength(1)
    expect(v2Records[0].id).toBe('t2')
  })

  it('returns an empty array when no records exist for the vehicle', async () => {
    const { getTelemetry } = await import('@/lib/db/telemetry.store')

    const result = await getTelemetry('non-existent')

    expect(result).toEqual([])
  })
})
