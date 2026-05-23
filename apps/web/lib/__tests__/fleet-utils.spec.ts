import { describe, it, expect } from 'vitest'
import { maskId, formatCoord, project, genSeries, BOG_BOUNDS } from '../fleet-utils'

describe('maskId', () => {
  it('masks the middle segment', () => {
    expect(maskId('DEV-ABC123-XC54')).toBe('DEV-****-XC54')
  })

  it('returns original string when format is not three parts', () => {
    expect(maskId('INVALID')).toBe('INVALID')
    expect(maskId('A-B')).toBe('A-B')
    expect(maskId('A-B-C-D')).toBe('A-B-C-D')
  })

  it('preserves first and last segments exactly', () => {
    expect(maskId('PREFIX-anything-SUFFIX')).toBe('PREFIX-****-SUFFIX')
  })
})

describe('formatCoord', () => {
  it('formats to 4 decimal places', () => {
    expect(formatCoord(4.6097, -74.0817)).toBe('4.6097°, -74.0817°')
  })

  it('rounds correctly', () => {
    expect(formatCoord(4.60976, -74.08176)).toBe('4.6098°, -74.0818°')
  })
})

describe('project', () => {
  it('maps Bogotá bounds centre to approximately (50, 50)', () => {
    const midLat = (BOG_BOUNDS.latMin + BOG_BOUNDS.latMax) / 2
    const midLng = (BOG_BOUNDS.lngMin + BOG_BOUNDS.lngMax) / 2
    const { x, y } = project(midLat, midLng)
    expect(x).toBeCloseTo(50, 0)
    expect(y).toBeCloseTo(50, 0)
  })

  it('maps bottom-left corner to (0, 100)', () => {
    const { x, y } = project(BOG_BOUNDS.latMin, BOG_BOUNDS.lngMin)
    expect(x).toBeCloseTo(0, 5)
    expect(y).toBeCloseTo(100, 5)
  })

  it('maps top-right corner to (100, 0)', () => {
    const { x, y } = project(BOG_BOUNDS.latMax, BOG_BOUNDS.lngMax)
    expect(x).toBeCloseTo(100, 5)
    expect(y).toBeCloseTo(0, 5)
  })

  it('respects custom width and height', () => {
    const { x, y } = project(BOG_BOUNDS.latMax, BOG_BOUNDS.lngMax, 200, 400)
    expect(x).toBeCloseTo(200, 5)
    expect(y).toBeCloseTo(0, 5)
  })
})

describe('genSeries', () => {
  it('returns the requested number of points', () => {
    expect(genSeries(42, 20, 50, 5)).toHaveLength(20)
  })

  it('is deterministic for the same seed', () => {
    const a = genSeries(7, 10, 60, 3)
    const b = genSeries(7, 10, 60, 3)
    expect(a).toEqual(b)
  })

  it('produces different output for different seeds', () => {
    const a = genSeries(1, 10, 60, 3)
    const b = genSeries(2, 10, 60, 3)
    expect(a).not.toEqual(b)
  })

  it('never produces negative values', () => {
    const series = genSeries(99, 50, 0, 100)
    expect(series.every((v) => v >= 0)).toBe(true)
  })

  it('applies downward trend', () => {
    const series = genSeries(1, 100, 100, 0, -1)
    expect(series[series.length - 1]).toBeLessThan(series[0])
  })
})
