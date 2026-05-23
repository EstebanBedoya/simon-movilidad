import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils'
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner'
import type { Alert } from '@/types/alert.types'

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert-1',
    vehicle_id: 'v-1',
    vehicle_name: 'Bus 12',
    type: 'high_temperature',
    message: 'Temperatura crítica detectada',
    resolved: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('AlertBanner', () => {
  it('renders the vehicle name', async () => {
    await render(<AlertBanner alert={makeAlert({ vehicle_name: 'Camión 3' })} onDismiss={vi.fn()} />)
    expect(screen.getByText('Camión 3')).toBeInTheDocument()
  })

  it('renders the alert message', async () => {
    await render(
      <AlertBanner alert={makeAlert({ message: 'Temperatura crítica detectada' })} onDismiss={vi.fn()} />
    )
    expect(screen.getByText(/temperatura crítica detectada/i)).toBeInTheDocument()
  })

  it('renders the "Vehículo" label', async () => {
    await render(<AlertBanner alert={makeAlert()} onDismiss={vi.fn()} />)
    expect(screen.getByText('Vehículo')).toBeInTheDocument()
  })

  it('renders a dismiss button', async () => {
    await render(<AlertBanner alert={makeAlert()} onDismiss={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    await render(<AlertBanner alert={makeAlert()} onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
