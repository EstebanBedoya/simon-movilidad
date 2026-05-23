import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test-utils'
import { SparkBlock } from '@/components/molecules/SparkBlock/SparkBlock'

describe('SparkBlock', () => {
  const baseProps = {
    label: 'Velocidad promedio',
    value: 72.4,
    unit: 'km/h',
    color: '#4ade80',
    data: [60, 65, 70, 75, 72],
  }

  describe('basic rendering', () => {
    it('renders the label', async () => {
      await render(<SparkBlock {...baseProps} />)
      expect(screen.getByText('Velocidad promedio')).toBeInTheDocument()
    })

    it('renders the rounded value', async () => {
      await render(<SparkBlock {...baseProps} value={72.7} />)
      expect(screen.getByText('73')).toBeInTheDocument()
    })

    it('renders the unit', async () => {
      await render(<SparkBlock {...baseProps} />)
      expect(screen.getByText('km/h')).toBeInTheDocument()
    })
  })

  describe('sparkline SVG', () => {
    it('renders an SVG element when data is non-empty', async () => {
      const { container } = await render(<SparkBlock {...baseProps} />)
      expect(container.querySelector('svg')).not.toBeNull()
    })

    it('does not render SVG when data is empty', async () => {
      const { container } = await render(<SparkBlock {...baseProps} data={[]} />)
      expect(container.querySelector('svg')).toBeNull()
    })

    it('does not crash when data is empty', async () => {
      const { container } = await render(<SparkBlock {...baseProps} data={[]} />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('axis labels', () => {
    it('renders axis labels when provided', async () => {
      await render(
        <SparkBlock {...baseProps} axisLabels={['00:00', '06:00', '12:00']} />
      )
      expect(screen.getByText('00:00')).toBeInTheDocument()
      expect(screen.getByText('06:00')).toBeInTheDocument()
      expect(screen.getByText('12:00')).toBeInTheDocument()
    })

    it('does not render axis label section when axisLabels is omitted', async () => {
      const { container } = await render(<SparkBlock {...baseProps} />)
      // axis labels section uses font-mono text-[9px], checking no extra spans beyond header
      // The simplest check: no text "00:00" etc.
      expect(screen.queryByText('00:00')).not.toBeInTheDocument()
    })
  })
})
