import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils'
import { Button } from '@/components/atoms/Button/Button'

describe('Button', () => {
  it('renders children', async () => {
    await render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it("uses 'default' variant classes by default", async () => {
    await render(<Button>Default</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-surface-1')
  })

  it("applies 'primary' variant classes", async () => {
    await render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-accent')
  })

  it("applies 'ghost' variant classes", async () => {
    await render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-transparent')
  })

  it("applies 'icon' variant classes", async () => {
    await render(<Button variant="icon">X</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('grid')
    expect(btn).toHaveClass('place-items-center')
  })

  it('merges custom className with variant classes', async () => {
    await render(<Button className="custom-class">Merged</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    await render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    await render(<Button disabled onClick={onClick}>Disabled</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('passes through native button attributes', async () => {
    await render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
