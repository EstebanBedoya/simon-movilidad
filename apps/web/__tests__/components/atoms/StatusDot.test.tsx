import { describe, it, expect } from 'vitest'
import { render } from '../../test-utils'
import { StatusDot } from '@/components/atoms/StatusDot/StatusDot'

describe('StatusDot', () => {
  it('renders a span element', async () => {
    const { container } = await render(<StatusDot />)
    expect(container.querySelector('span')).not.toBeNull()
  })

  it("defaults to 'ok' variant — applies bg-success class", async () => {
    const { container } = await render(<StatusDot />)
    expect(container.firstChild).toHaveClass('bg-success')
  })

  it("applies 'warn' variant class", async () => {
    const { container } = await render(<StatusDot variant="warn" />)
    expect(container.firstChild).toHaveClass('bg-warning')
  })

  it("applies 'danger' variant class", async () => {
    const { container } = await render(<StatusDot variant="danger" />)
    expect(container.firstChild).toHaveClass('bg-danger')
  })

  it("applies 'dim' variant class", async () => {
    const { container } = await render(<StatusDot variant="dim" />)
    expect(container.firstChild).toHaveClass('bg-foreground-dim')
  })

  it("renders no pulse child when pulse is false (default)", async () => {
    const { container } = await render(<StatusDot />)
    expect(container.querySelectorAll('span')).toHaveLength(1)
  })

  it('renders a pulse child span when pulse is true', async () => {
    const { container } = await render(<StatusDot pulse />)
    expect(container.querySelectorAll('span')).toHaveLength(2)
  })

  it("applies 'sm' size classes w-1.5 h-1.5", async () => {
    const { container } = await render(<StatusDot size="sm" />)
    expect(container.firstChild).toHaveClass('w-1.5')
    expect(container.firstChild).toHaveClass('h-1.5')
  })

  it("applies 'md' size classes w-[7px] h-[7px] (default)", async () => {
    const { container } = await render(<StatusDot />)
    expect(container.firstChild).toHaveClass('w-[7px]')
    expect(container.firstChild).toHaveClass('h-[7px]')
  })
})
