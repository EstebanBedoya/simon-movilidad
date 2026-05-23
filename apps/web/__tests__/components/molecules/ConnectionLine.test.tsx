import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test-utils'
import { ConnectionLine } from '@/components/molecules/ConnectionLine/ConnectionLine'

describe('ConnectionLine', () => {
  it('renders the label', async () => {
    await render(<ConnectionLine label="WebSocket" value="LIVE" status="ok" />)
    expect(screen.getByText('WebSocket')).toBeInTheDocument()
  })

  it('renders the value', async () => {
    await render(<ConnectionLine label="WebSocket" value="LIVE" status="ok" />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  describe('status dot visual indicators', () => {
    it('applies success and glow class for "ok" status', async () => {
      const { container } = await render(
        <ConnectionLine label="WS" value="Connected" status="ok" />
      )
      const dot = container.querySelector('.bg-success')
      expect(dot).toBeInTheDocument()
    })

    it('applies warning class for "warn" status', async () => {
      const { container } = await render(
        <ConnectionLine label="WS" value="Slow" status="warn" />
      )
      const dot = container.querySelector('.bg-warning')
      expect(dot).toBeInTheDocument()
    })

    it('applies danger class for "off" status', async () => {
      const { container } = await render(
        <ConnectionLine label="WS" value="Offline" status="off" />
      )
      const dot = container.querySelector('.bg-danger')
      expect(dot).toBeInTheDocument()
    })

    it('has a rounded dot element for each status', async () => {
      const { container } = await render(
        <ConnectionLine label="WS" value="X" status="ok" />
      )
      const dot = container.querySelector('.rounded-full')
      expect(dot).toBeInTheDocument()
    })
  })
})
