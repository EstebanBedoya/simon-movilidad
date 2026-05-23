import { describe, it, expect } from 'vitest'
import { deriveUiStatus, computeHeading } from '@/types/fleet'
import type { Vehicle } from '@/types/vehicle.types'
import type { Alert } from '@/types/alert.types'

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
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'a1',
    vehicle_id: 'v1',
    vehicle_name: 'Bus 001',
    type: 'low_fuel',
    message: 'Low fuel',
    resolved: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// deriveUiStatus
// ---------------------------------------------------------------------------

describe('deriveUiStatus', () => {
  it("returns 'offline' when vehicle status is 'inactive'", () => {
    const vehicle = makeVehicle({ status: 'inactive' })
    expect(deriveUiStatus(vehicle, [])).toBe('offline')
  })

  it("returns 'alert' when there is at least one unresolved alert", () => {
    const vehicle = makeVehicle({
      latest_telemetry: {
        vehicle_id: 'v1', lat: 0, lng: 0, speed: 50,
        fuel_level: 80, temperature: 60, timestamp: new Date().toISOString(),
      },
    })
    const alerts = [makeAlert({ resolved: false })]
    expect(deriveUiStatus(vehicle, alerts)).toBe('alert')
  })

  it("does NOT return 'alert' when all alerts are resolved", () => {
    const vehicle = makeVehicle({
      latest_telemetry: {
        vehicle_id: 'v1', lat: 0, lng: 0, speed: 50,
        fuel_level: 80, temperature: 60, timestamp: new Date().toISOString(),
      },
    })
    const alerts = [makeAlert({ resolved: true })]
    // resolved alert → falls through to speed check → active
    expect(deriveUiStatus(vehicle, alerts)).toBe('active')
  })

  it("returns 'offline' when latest_telemetry is absent (speed is null)", () => {
    const vehicle = makeVehicle({ latest_telemetry: undefined })
    expect(deriveUiStatus(vehicle, [])).toBe('offline')
  })

  it("returns 'idle' when speed is 0", () => {
    const vehicle = makeVehicle({
      latest_telemetry: {
        vehicle_id: 'v1', lat: 0, lng: 0, speed: 0,
        fuel_level: 80, temperature: 60, timestamp: new Date().toISOString(),
      },
    })
    expect(deriveUiStatus(vehicle, [])).toBe('idle')
  })

  it("returns 'active' when speed is greater than 0", () => {
    const vehicle = makeVehicle({
      latest_telemetry: {
        vehicle_id: 'v1', lat: 0, lng: 0, speed: 30,
        fuel_level: 80, temperature: 60, timestamp: new Date().toISOString(),
      },
    })
    expect(deriveUiStatus(vehicle, [])).toBe('active')
  })

  it("'inactive' status short-circuits before alert check", () => {
    const vehicle = makeVehicle({ status: 'inactive' })
    const alerts = [makeAlert({ resolved: false })]
    // even with unresolved alert, inactive wins
    expect(deriveUiStatus(vehicle, alerts)).toBe('offline')
  })

  it("returns 'alert' even when speed is 0, if there is an unresolved alert", () => {
    const vehicle = makeVehicle({
      latest_telemetry: {
        vehicle_id: 'v1', lat: 0, lng: 0, speed: 0,
        fuel_level: 80, temperature: 60, timestamp: new Date().toISOString(),
      },
    })
    const alerts = [makeAlert({ resolved: false })]
    expect(deriveUiStatus(vehicle, alerts)).toBe('alert')
  })
})

// ---------------------------------------------------------------------------
// computeHeading
// ---------------------------------------------------------------------------

describe('computeHeading', () => {
  it('returns a number in [0, 360)', () => {
    const heading = computeHeading({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })
    expect(heading).toBeGreaterThanOrEqual(0)
    expect(heading).toBeLessThan(360)
  })

  it('returns 0 (North) when moving straight north', () => {
    const heading = computeHeading({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })
    expect(heading).toBeCloseTo(0, 5)
  })

  it('returns 90 (East) when moving straight east', () => {
    const heading = computeHeading({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })
    expect(heading).toBeCloseTo(90, 5)
  })

  it('returns 180 (South) when moving straight south', () => {
    const heading = computeHeading({ lat: 1, lng: 0 }, { lat: 0, lng: 0 })
    expect(heading).toBeCloseTo(180, 5)
  })

  it('returns 270 (West) when moving straight west', () => {
    const heading = computeHeading({ lat: 0, lng: 1 }, { lat: 0, lng: 0 })
    expect(heading).toBeCloseTo(270, 5)
  })

  it('never returns exactly 360 (wraps to 0)', () => {
    // Identical points → atan2(0,0) = 0
    const heading = computeHeading({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })
    expect(heading).toBe(0)
  })
})
