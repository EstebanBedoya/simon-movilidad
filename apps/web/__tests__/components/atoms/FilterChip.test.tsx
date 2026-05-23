import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils'
import { FilterChip } from '@/components/atoms/FilterChip/FilterChip'

describe('FilterChip', () => {
  it('renders the label', async () => {
    await render(<FilterChip label="All" />)
    expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument()
  })

  it('renders a button element', async () => {
    await render(<FilterChip label="Active" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applies active styles when active is true', async () => {
    await render(<FilterChip label="Active" active />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-surface-2')
    expect(btn).toHaveClass('text-foreground')
  })

  it('applies inactive styles when active is false (default)', async () => {
    await render(<FilterChip label="Inactive" />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-transparent')
    expect(btn).toHaveClass('text-foreground-muted')
  })

  it('renders the dot span when dot prop is provided', async () => {
    const { container } = await render(<FilterChip label="Alerts" dot="#ff4d5e" />)
    const dotSpan = container.querySelector('span[style]') as HTMLElement
    expect(dotSpan).not.toBeNull()
    expect(dotSpan.style.background).toBe('rgb(255, 77, 94)')
  })

  it('does not render a dot when dot is not provided', async () => {
    const { container } = await render(<FilterChip label="No dot" />)
    expect(container.querySelector('span[style]')).toBeNull()
  })

  it('renders the count when provided', async () => {
    await render(<FilterChip label="Alerts" count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders count=0 (0 is a defined value)', async () => {
    await render(<FilterChip label="Empty" count={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('does not render a count span when count is not provided', async () => {
    await render(<FilterChip label="No count" />)
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    await render(<FilterChip label="Click me" onClick={onClick} />)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not throw when onClick is not provided and chip is clicked', async () => {
    const user = userEvent.setup()
    await render(<FilterChip label="No handler" />)
    await expect(user.click(screen.getByRole('button'))).resolves.not.toThrow()
  })
})
