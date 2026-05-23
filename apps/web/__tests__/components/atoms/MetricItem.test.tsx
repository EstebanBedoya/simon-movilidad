import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test-utils'
import { MetricItem } from '@/components/atoms/MetricItem/MetricItem'

describe('MetricItem', () => {
  it('renders the label', async () => {
    await render(<MetricItem label="Speed" value="60" />)
    expect(screen.getByText('Speed')).toBeInTheDocument()
  })

  it('renders the value', async () => {
    await render(<MetricItem label="Speed" value="60" />)
    expect(screen.getByText('60')).toBeInTheDocument()
  })

  it('renders the unit when provided', async () => {
    await render(<MetricItem label="Speed" value="60" unit="km/h" />)
    expect(screen.getByText('km/h')).toBeInTheDocument()
  })

  it('does not render a unit element when unit is not provided', async () => {
    await render(<MetricItem label="Speed" value="60" />)
    expect(screen.queryByText(/km/)).toBeNull()
  })

  it("defaults to 'ok' state — applies text-foreground class", async () => {
    const { container } = await render(<MetricItem label="Speed" value="60" />)
    const valueSpan = container.querySelector('.font-mono') as HTMLElement
    expect(valueSpan).toHaveClass('text-foreground')
  })

  it("applies 'warn' state class text-warning", async () => {
    const { container } = await render(<MetricItem label="Temp" value="90" state="warn" />)
    const valueSpan = container.querySelector('.font-mono') as HTMLElement
    expect(valueSpan).toHaveClass('text-warning')
  })

  it("applies 'danger' state class text-danger", async () => {
    const { container } = await render(<MetricItem label="Fuel" value="10" state="danger" />)
    const valueSpan = container.querySelector('.font-mono') as HTMLElement
    expect(valueSpan).toHaveClass('text-danger')
  })

  it('renders children when provided', async () => {
    await render(
      <MetricItem label="Fuel" value="50">
        <span data-testid="child-node">FuelBar here</span>
      </MetricItem>
    )
    expect(screen.getByTestId('child-node')).toBeInTheDocument()
  })

  it('does not render a children slot when children is absent', async () => {
    const { container } = await render(<MetricItem label="Speed" value="60" />)
    // Root div has exactly 2 children: label span + value span
    expect(container.firstChild?.childNodes).toHaveLength(2)
  })

  it('accepts a ReactNode as value', async () => {
    await render(<MetricItem label="Status" value={<strong>Active</strong>} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
