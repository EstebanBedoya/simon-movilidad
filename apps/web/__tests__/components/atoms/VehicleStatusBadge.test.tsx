import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test-utils'
import { VehicleStatusBadge } from '@/components/atoms/VehicleStatusBadge/VehicleStatusBadge'

describe('VehicleStatusBadge', () => {
  it("renders the label 'En ruta' for 'active' status", async () => {
    await render(<VehicleStatusBadge status="active" />)
    expect(screen.getByText('En ruta')).toBeInTheDocument()
  })

  it("renders the label 'Detenido' for 'idle' status", async () => {
    await render(<VehicleStatusBadge status="idle" />)
    expect(screen.getByText('Detenido')).toBeInTheDocument()
  })

  it("renders the label 'Alerta' for 'alert' status", async () => {
    await render(<VehicleStatusBadge status="alert" />)
    expect(screen.getByText('Alerta')).toBeInTheDocument()
  })

  it("renders the label 'Sin señal' for 'offline' status", async () => {
    await render(<VehicleStatusBadge status="offline" />)
    expect(screen.getByText('Sin señal')).toBeInTheDocument()
  })

  it("applies accent style classes for 'active' status", async () => {
    const { container } = await render(<VehicleStatusBadge status="active" />)
    expect(container.firstChild).toHaveClass('bg-accent-soft')
    expect(container.firstChild).toHaveClass('text-accent')
  })

  it("applies warning style classes for 'idle' status", async () => {
    const { container } = await render(<VehicleStatusBadge status="idle" />)
    expect(container.firstChild).toHaveClass('bg-warning-soft')
    expect(container.firstChild).toHaveClass('text-warning')
  })

  it("applies danger style classes for 'alert' status", async () => {
    const { container } = await render(<VehicleStatusBadge status="alert" />)
    expect(container.firstChild).toHaveClass('bg-danger-soft')
    expect(container.firstChild).toHaveClass('text-danger')
  })

  it("applies dim style classes for 'offline' status", async () => {
    const { container } = await render(<VehicleStatusBadge status="offline" />)
    expect(container.firstChild).toHaveClass('bg-surface-3')
    expect(container.firstChild).toHaveClass('text-foreground-dim')
  })

  it('renders a span element', async () => {
    const { container } = await render(<VehicleStatusBadge status="active" />)
    expect(container.querySelector('span')).not.toBeNull()
  })
})
