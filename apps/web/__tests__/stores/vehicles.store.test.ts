import { describe, it, expect, beforeEach } from 'vitest'
import { useVehiclesStore } from '@/stores/vehicles.store'
import type { Vehicle } from '@/types/vehicle.types'
import type { Telemetry } from '@/types/telemetry.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v1',
    device_id: 'dev-1',
    name: 'Bus 001',
    city: 'medellin',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTelemetry(overrides: Partial<Telemetry> = {}): Telemetry {
  return {
    vehicle_id: 'v1',
    lat: 6.2518,
    lng: -75.5636,
    speed: 45,
    fuel_level: 75,
    temperature: 85,
    timestamp: '2024-06-01T12:00:00.000Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useVehiclesStore.setState({ vehicles: [], isLoading: false, error: null })
})

// ---------------------------------------------------------------------------
// setVehicles
// ---------------------------------------------------------------------------

describe('useVehiclesStore — setVehicles', () => {
  it('replaces the vehicles array with the provided list', () => {
    useVehiclesStore.getState().setVehicles([makeVehicle({ id: 'old' })])

    const newList = [makeVehicle({ id: 'new-1' }), makeVehicle({ id: 'new-2' })]
    useVehiclesStore.getState().setVehicles(newList)

    expect(useVehiclesStore.getState().vehicles).toEqual(newList)
  })

  it('handles an empty array — clears all vehicles', () => {
    useVehiclesStore.getState().setVehicles([makeVehicle()])
    useVehiclesStore.getState().setVehicles([])

    expect(useVehiclesStore.getState().vehicles).toEqual([])
  })

  it('stores all vehicles in the provided order', () => {
    const vehicles = [makeVehicle({ id: 'v1' }), makeVehicle({ id: 'v2' }), makeVehicle({ id: 'v3' })]
    useVehiclesStore.getState().setVehicles(vehicles)

    const ids = useVehiclesStore.getState().vehicles.map((v) => v.id)
    expect(ids).toEqual(['v1', 'v2', 'v3'])
  })
})

// ---------------------------------------------------------------------------
// updateVehiclePosition
// ---------------------------------------------------------------------------

describe('useVehiclesStore — updateVehiclePosition', () => {
  it('patches latest_telemetry on the matching vehicle', () => {
    const vehicle = makeVehicle({ id: 'v1' })
    useVehiclesStore.setState({ vehicles: [vehicle], isLoading: false, error: null })

    const telemetry = makeTelemetry({ vehicle_id: 'v1', speed: 60 })
    useVehiclesStore.getState().updateVehiclePosition('v1', telemetry)

    expect(useVehiclesStore.getState().vehicles[0].latest_telemetry).toEqual(telemetry)
  })

  it('does not modify other vehicles in the list', () => {
    const v1 = makeVehicle({ id: 'v1' })
    const v2 = makeVehicle({ id: 'v2', name: 'Bus 002' })
    useVehiclesStore.setState({ vehicles: [v1, v2], isLoading: false, error: null })

    const telemetry = makeTelemetry({ vehicle_id: 'v1' })
    useVehiclesStore.getState().updateVehiclePosition('v1', telemetry)

    const updated = useVehiclesStore.getState().vehicles
    expect(updated.find((v) => v.id === 'v2')).toEqual(v2)
  })

  it('does not mutate the original vehicle object (immutability)', () => {
    const vehicle = makeVehicle({ id: 'v1' })
    useVehiclesStore.setState({ vehicles: [vehicle], isLoading: false, error: null })

    const telemetry = makeTelemetry({ vehicle_id: 'v1' })
    useVehiclesStore.getState().updateVehiclePosition('v1', telemetry)

    // the original object reference must be untouched
    expect(vehicle.latest_telemetry).toBeUndefined()
  })

  it('does not change state when the vehicleId does not match', () => {
    const vehicle = makeVehicle({ id: 'v1' })
    useVehiclesStore.setState({ vehicles: [vehicle], isLoading: false, error: null })

    const telemetry = makeTelemetry({ vehicle_id: 'unknown' })
    useVehiclesStore.getState().updateVehiclePosition('unknown', telemetry)

    expect(useVehiclesStore.getState().vehicles[0].latest_telemetry).toBeUndefined()
  })

  it('preserves all other vehicle fields when patching telemetry', () => {
    const vehicle = makeVehicle({ id: 'v1', name: 'Bus Special', city: 'bogota' })
    useVehiclesStore.setState({ vehicles: [vehicle], isLoading: false, error: null })

    const telemetry = makeTelemetry({ vehicle_id: 'v1' })
    useVehiclesStore.getState().updateVehiclePosition('v1', telemetry)

    const patched = useVehiclesStore.getState().vehicles[0]
    expect(patched.name).toBe('Bus Special')
    expect(patched.city).toBe('bogota')
  })
})

// ---------------------------------------------------------------------------
// setLoading / setError
// ---------------------------------------------------------------------------

describe('useVehiclesStore — setLoading', () => {
  it('sets isLoading to true', () => {
    useVehiclesStore.getState().setLoading(true)

    expect(useVehiclesStore.getState().isLoading).toBe(true)
  })

  it('sets isLoading back to false', () => {
    useVehiclesStore.setState({ vehicles: [], isLoading: true, error: null })
    useVehiclesStore.getState().setLoading(false)

    expect(useVehiclesStore.getState().isLoading).toBe(false)
  })
})

describe('useVehiclesStore — setError', () => {
  it('sets an error message', () => {
    useVehiclesStore.getState().setError('Network failure')

    expect(useVehiclesStore.getState().error).toBe('Network failure')
  })

  it('clears the error by setting null', () => {
    useVehiclesStore.setState({ vehicles: [], isLoading: false, error: 'some error' })
    useVehiclesStore.getState().setError(null)

    expect(useVehiclesStore.getState().error).toBeNull()
  })
})
