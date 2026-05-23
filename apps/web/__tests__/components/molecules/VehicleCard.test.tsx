import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils'
import { VehicleCard } from '@/components/molecules/VehicleCard/VehicleCard'
import { useAlertsStore } from '@/stores/alerts.store'
import type { Vehicle } from '@/types/vehicle.types'
import type { Alert } from '@/types/alert.types'

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1',
    device_id: 'DEV-001',
    name: 'Bus 42',
    city: 'medellin',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    latest_telemetry: {
      vehicle_id: 'v-1',
      lat: 6.2,
      lng: -75.5,
      speed: 60,
      fuel_level: 50,
      temperature: 75,
      timestamp: '2024-01-01T00:00:00Z',
    },
    ...overrides,
  }
}

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'a-1',
    vehicle_id: 'v-1',
    vehicle_name: 'Bus 42',
    type: 'low_fuel',
    message: 'Combustible bajo',
    resolved: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  useAlertsStore.setState({ alerts: [], unresolvedCount: 0 })
})

describe('VehicleCard', () => {
  describe('basic rendering', () => {
    it('renders the vehicle device id', async () => {
      await render(<VehicleCard vehicle={makeVehicle({ device_id: 'DEV-007' })} />)
      expect(screen.getByText('DEV-007')).toBeInTheDocument()
    })

    it('renders the vehicle name', async () => {
      await render(<VehicleCard vehicle={makeVehicle({ name: 'Camión 3' })} />)
      expect(screen.getByText('Camión 3')).toBeInTheDocument()
    })

    it('renders the city', async () => {
      await render(<VehicleCard vehicle={makeVehicle({ city: 'bogota' })} />)
      expect(screen.getByText('bogota')).toBeInTheDocument()
    })
  })

  describe('selected state', () => {
    it('applies border-accent-line class when selected', async () => {
      const { container } = await render(
        <VehicleCard vehicle={makeVehicle()} selected />
      )
      expect(container.firstChild).toHaveClass('border-accent-line')
    })

    it('does not apply border-accent-line class when not selected', async () => {
      const { container } = await render(
        <VehicleCard vehicle={makeVehicle()} selected={false} />
      )
      expect(container.firstChild).not.toHaveClass('border-accent-line')
    })

    it('renders the left accent bar when selected', async () => {
      const { container } = await render(<VehicleCard vehicle={makeVehicle()} selected />)
      // The selection indicator is a <span> — distinct from the FuelBar <div>
      const bar = container.querySelector('span.bg-accent')
      expect(bar).toBeInTheDocument()
    })

    it('does not render the left accent bar when not selected', async () => {
      const { container } = await render(
        <VehicleCard vehicle={makeVehicle()} selected={false} />
      )
      const bar = container.querySelector('span.absolute.bg-accent')
      expect(bar).toBeNull()
    })
  })

  describe('offline uiStatus — temperature masking', () => {
    it('shows "--" for temperature when vehicle status is inactive (offline)', async () => {
      const vehicle = makeVehicle({
        status: 'inactive',
        latest_telemetry: {
          vehicle_id: 'v-1',
          lat: 0,
          lng: 0,
          speed: 0,
          fuel_level: 50,
          temperature: 80,
          timestamp: '2024-01-01T00:00:00Z',
        },
      })
      await render(<VehicleCard vehicle={vehicle} />)
      expect(screen.getByText('--')).toBeInTheDocument()
    })

    it('shows "--" for temperature when telemetry is absent (no speed → offline)', async () => {
      const vehicle = makeVehicle({ latest_telemetry: undefined })
      await render(<VehicleCard vehicle={vehicle} />)
      expect(screen.getByText('--')).toBeInTheDocument()
    })

    it('shows numeric temperature when vehicle is active', async () => {
      const vehicle = makeVehicle({
        status: 'active',
        latest_telemetry: {
          vehicle_id: 'v-1',
          lat: 0,
          lng: 0,
          speed: 50,
          fuel_level: 50,
          temperature: 78,
          timestamp: '2024-01-01T00:00:00Z',
        },
      })
      await render(<VehicleCard vehicle={vehicle} />)
      expect(screen.getByText('78')).toBeInTheDocument()
    })
  })

  describe('fuel threshold states via FuelBar', () => {
    it('renders FuelBar with danger fill when fuel < 15', async () => {
      const vehicle = makeVehicle({
        latest_telemetry: {
          vehicle_id: 'v-1',
          lat: 0,
          lng: 0,
          speed: 40,
          fuel_level: 10,
          temperature: 70,
          timestamp: '2024-01-01T00:00:00Z',
        },
      })
      const { container } = await render(<VehicleCard vehicle={vehicle} />)
      const fuelFill = container.querySelector('[style*="width: 10%"]') as HTMLElement | null
      expect(fuelFill).toBeInTheDocument()
      expect(fuelFill).toHaveClass('bg-danger')
    })

    it('renders FuelBar with warning fill when fuel is in [15, 35)', async () => {
      const vehicle = makeVehicle({
        latest_telemetry: {
          vehicle_id: 'v-1',
          lat: 0,
          lng: 0,
          speed: 40,
          fuel_level: 25,
          temperature: 70,
          timestamp: '2024-01-01T00:00:00Z',
        },
      })
      const { container } = await render(<VehicleCard vehicle={vehicle} />)
      const fuelFill = container.querySelector('[style*="width: 25%"]') as HTMLElement | null
      expect(fuelFill).toBeInTheDocument()
      expect(fuelFill).toHaveClass('bg-warning')
    })

    it('renders FuelBar with accent fill when fuel >= 35', async () => {
      const vehicle = makeVehicle({
        latest_telemetry: {
          vehicle_id: 'v-1',
          lat: 0,
          lng: 0,
          speed: 40,
          fuel_level: 60,
          temperature: 70,
          timestamp: '2024-01-01T00:00:00Z',
        },
      })
      const { container } = await render(<VehicleCard vehicle={vehicle} />)
      const fuelFill = container.querySelector('[style*="width: 60%"]') as HTMLElement | null
      expect(fuelFill).toBeInTheDocument()
      expect(fuelFill).toHaveClass('bg-accent')
    })
  })

  describe('onClick', () => {
    it('calls onClick when the card is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      await render(<VehicleCard vehicle={makeVehicle()} onClick={onClick} />)
      await user.click(screen.getByText('Bus 42'))
      expect(onClick).toHaveBeenCalledOnce()
    })

    it('does not throw when onClick is not provided', async () => {
      const user = userEvent.setup()
      await render(<VehicleCard vehicle={makeVehicle()} />)
      await expect(user.click(screen.getByText('Bus 42'))).resolves.not.toThrow()
    })
  })

  describe('Zustand store integration', () => {
    it('reflects alert state from useAlertsStore for matching vehicle', async () => {
      const alert = makeAlert({ vehicle_id: 'v-1', resolved: false })
      useAlertsStore.setState({ alerts: [alert], unresolvedCount: 1 })

      const { container } = await render(<VehicleCard vehicle={makeVehicle({ id: 'v-1', status: 'active', latest_telemetry: {
        vehicle_id: 'v-1', lat: 0, lng: 0, speed: 40, fuel_level: 50, temperature: 70, timestamp: '2024-01-01T00:00:00Z'
      } })} />)
      // An unresolved alert should produce uiStatus='alert' → border-danger/35 when not selected
      expect(container.firstChild).toHaveClass('border-danger/35')
    })

    it('does not apply alert border for a different vehicle id', async () => {
      const alert = makeAlert({ vehicle_id: 'v-other', resolved: false })
      useAlertsStore.setState({ alerts: [alert], unresolvedCount: 1 })

      const { container } = await render(<VehicleCard vehicle={makeVehicle({ id: 'v-1', status: 'active', latest_telemetry: {
        vehicle_id: 'v-1', lat: 0, lng: 0, speed: 40, fuel_level: 50, temperature: 70, timestamp: '2024-01-01T00:00:00Z'
      } })} />)
      expect(container.firstChild).not.toHaveClass('border-danger/35')
    })
  })
})
