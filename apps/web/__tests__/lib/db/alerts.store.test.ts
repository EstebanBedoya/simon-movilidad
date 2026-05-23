import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Alert } from '@/types/alert.types'

beforeEach(async () => {
  vi.resetModules()
  const { IDBFactory } = await import('fake-indexeddb')
  // @ts-expect-error replacing global indexedDB with a fresh instance
  globalThis.indexedDB = new IDBFactory()
})

const mockAlert: Alert = {
  id: 'a1',
  vehicle_id: 'v1',
  vehicle_name: 'Bus 01',
  type: 'low_fuel',
  message: 'Fuel below 20%',
  resolved: false,
  created_at: '2024-01-01T10:00:00Z',
}

describe('saveAlerts + getAlerts', () => {
  it('round-trips a single alert correctly', async () => {
    const { saveAlerts, getAlerts } = await import('@/lib/db/alerts.store')

    await saveAlerts([mockAlert])
    const result = await getAlerts()

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(mockAlert)
  })

  it('round-trips multiple alerts correctly', async () => {
    const { saveAlerts, getAlerts } = await import('@/lib/db/alerts.store')

    const a2: Alert = { ...mockAlert, id: 'a2', type: 'speeding', message: 'Speed exceeded' }
    await saveAlerts([mockAlert, a2])
    const result = await getAlerts()

    expect(result).toHaveLength(2)
    const ids = result.map((a) => a.id)
    expect(ids).toContain('a1')
    expect(ids).toContain('a2')
  })

  it('returns an empty array when no alerts are stored', async () => {
    const { getAlerts } = await import('@/lib/db/alerts.store')

    const result = await getAlerts()

    expect(result).toEqual([])
  })

  it('put overwrites an existing alert with the same id', async () => {
    const { saveAlerts, getAlerts } = await import('@/lib/db/alerts.store')

    await saveAlerts([mockAlert])
    await saveAlerts([{ ...mockAlert, resolved: true, resolved_at: '2024-01-01T11:00:00Z' }])
    const result = await getAlerts()

    expect(result).toHaveLength(1)
    expect(result[0].resolved).toBe(true)
    expect(result[0].resolved_at).toBe('2024-01-01T11:00:00Z')
  })
})
