import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils'
import { AlertRow } from '@/components/molecules/AlertRow/AlertRow'
import type { Alert } from '@/types/alert.types'

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert-1',
    vehicle_id: 'v-1',
    vehicle_name: 'Bus 42',
    type: 'low_fuel',
    message: 'Combustible bajo',
    resolved: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('AlertRow', () => {
  describe('content rendering', () => {
    it('renders the alert message', async () => {
      await render(<AlertRow alert={makeAlert({ message: 'Temperatura alta' })} />)
      expect(screen.getByText('Temperatura alta')).toBeInTheDocument()
    })

    it('renders the vehicle name', async () => {
      await render(<AlertRow alert={makeAlert({ vehicle_name: 'Camión 7' })} />)
      expect(screen.getByText('Camión 7')).toBeInTheDocument()
    })

    it('renders type label replacing underscore with space', async () => {
      await render(<AlertRow alert={makeAlert({ type: 'low_fuel' })} />)
      expect(screen.getByText('low fuel')).toBeInTheDocument()
    })
  })

  describe('icon and style per AlertType', () => {
    const types: Array<Alert['type']> = ['low_fuel', 'high_temperature', 'speeding', 'offline']

    types.forEach((type) => {
      it(`renders without crashing for type "${type}"`, async () => {
        const { container } = await render(<AlertRow alert={makeAlert({ type })} />)
        expect(container.firstChild).toBeInTheDocument()
      })
    })

    it('applies warning background class for low_fuel', async () => {
      const { container } = await render(<AlertRow alert={makeAlert({ type: 'low_fuel' })} />)
      expect(container.firstChild).toHaveClass('bg-warning-soft')
    })

    it('applies danger background class for high_temperature', async () => {
      const { container } = await render(<AlertRow alert={makeAlert({ type: 'high_temperature' })} />)
      expect(container.firstChild).toHaveClass('bg-danger-soft')
    })

    it('applies surface background class for offline', async () => {
      const { container } = await render(<AlertRow alert={makeAlert({ type: 'offline' })} />)
      expect(container.firstChild).toHaveClass('bg-surface-3')
    })
  })

  describe('onResolve button', () => {
    it('shows "Resolver" button when alert is unresolved and onResolve is provided', async () => {
      await render(<AlertRow alert={makeAlert({ resolved: false })} onResolve={vi.fn()} />)
      expect(screen.getByRole('button', { name: /resolver/i })).toBeInTheDocument()
    })

    it('does not show "Resolver" button when alert is resolved', async () => {
      await render(<AlertRow alert={makeAlert({ resolved: true })} onResolve={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /resolver/i })).not.toBeInTheDocument()
    })

    it('does not show "Resolver" button when onResolve is not provided', async () => {
      await render(<AlertRow alert={makeAlert({ resolved: false })} />)
      expect(screen.queryByRole('button', { name: /resolver/i })).not.toBeInTheDocument()
    })

    it('calls onResolve with the alert id when button is clicked', async () => {
      const user = userEvent.setup()
      const onResolve = vi.fn()
      await render(<AlertRow alert={makeAlert({ id: 'alert-99' })} onResolve={onResolve} />)
      await user.click(screen.getByRole('button', { name: /resolver/i }))
      expect(onResolve).toHaveBeenCalledOnce()
      expect(onResolve).toHaveBeenCalledWith('alert-99')
    })
  })

  describe('timeAgo display', () => {
    it('shows "ahora" for a timestamp less than 1 minute ago', async () => {
      const recent = new Date(Date.now() - 30_000).toISOString() // 30 seconds ago
      await render(<AlertRow alert={makeAlert({ created_at: recent })} />)
      expect(screen.getByText('ahora')).toBeInTheDocument()
    })

    it('shows minutes for a timestamp ~30 min ago', async () => {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60_000).toISOString()
      await render(<AlertRow alert={makeAlert({ created_at: thirtyMinsAgo })} />)
      expect(screen.getByText('30 min')).toBeInTheDocument()
    })

    it('shows hours for a timestamp ~2h ago', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString()
      await render(<AlertRow alert={makeAlert({ created_at: twoHoursAgo })} />)
      expect(screen.getByText('2 h')).toBeInTheDocument()
    })
  })
})
