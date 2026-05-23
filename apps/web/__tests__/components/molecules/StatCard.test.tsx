import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test-utils'
import { StatCard } from '@/components/molecules/StatCard/StatCard'

describe('StatCard', () => {
  describe('basic rendering', () => {
    it('renders the label', async () => {
      await render(<StatCard label="Velocidad" value={80} />)
      expect(screen.getByText('Velocidad')).toBeInTheDocument()
    })

    it('renders a numeric value', async () => {
      await render(<StatCard label="Vel." value={120} />)
      expect(screen.getByText('120')).toBeInTheDocument()
    })

    it('renders a string value', async () => {
      await render(<StatCard label="Estado" value="OK" />)
      expect(screen.getByText('OK')).toBeInTheDocument()
    })

    it('renders the unit when provided', async () => {
      await render(<StatCard label="Vel." value={80} unit="km/h" />)
      expect(screen.getByText('km/h')).toBeInTheDocument()
    })

    it('does not render a unit element when unit is omitted', async () => {
      await render(<StatCard label="Vel." value={80} />)
      expect(screen.queryByText('km/h')).not.toBeInTheDocument()
    })
  })

  describe('trend display', () => {
    it('renders the trend text when provided', async () => {
      await render(<StatCard label="Vel." value={80} trend="+5% esta semana" />)
      expect(screen.getByText('+5% esta semana')).toBeInTheDocument()
    })

    it('does not render trend section when trend is omitted', async () => {
      await render(<StatCard label="Vel." value={80} />)
      expect(screen.queryByText(/esta semana/)).not.toBeInTheDocument()
    })

    it('applies success color class for upward trend', async () => {
      const { container } = await render(
        <StatCard label="Vel." value={80} trend="+5%" trendDir="up" />
      )
      const trendEl = container.querySelector('.text-success')
      expect(trendEl).toBeInTheDocument()
    })

    it('applies danger color class for downward trend', async () => {
      const { container } = await render(
        <StatCard label="Vel." value={80} trend="-3%" trendDir="down" />
      )
      const trendEl = container.querySelector('.text-danger')
      expect(trendEl).toBeInTheDocument()
    })

    it('applies muted color class for neutral trend', async () => {
      const { container } = await render(
        <StatCard label="Vel." value={80} trend="sin cambio" trendDir="neutral" />
      )
      const trendEl = container.querySelector('.text-foreground-muted')
      expect(trendEl).toBeInTheDocument()
    })
  })

  describe('accent and danger coloring', () => {
    it('applies accent text class when accent prop is true', async () => {
      const { container } = await render(<StatCard label="Vel." value={80} accent />)
      const valueEl = container.querySelector('.text-accent')
      expect(valueEl).toBeInTheDocument()
    })

    it('applies danger text class when danger prop is true', async () => {
      const { container } = await render(<StatCard label="Vel." value={80} danger />)
      const valueEl = container.querySelector('.text-danger')
      expect(valueEl).toBeInTheDocument()
    })

    it('uses default foreground color when neither accent nor danger', async () => {
      const { container } = await render(<StatCard label="Vel." value={80} />)
      const valueEl = container.querySelector('.text-foreground')
      expect(valueEl).toBeInTheDocument()
    })
  })
})
