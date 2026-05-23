import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Home } from 'lucide-react'
import { render } from '../../test-utils'
import { NavItem } from '@/components/molecules/NavItem/NavItem'

describe('NavItem', () => {
  const baseProps = {
    icon: Home,
    label: 'Inicio',
  }

  describe('basic rendering', () => {
    it('renders the label text', async () => {
      await render(<NavItem {...baseProps} />)
      expect(screen.getByText('Inicio')).toBeInTheDocument()
    })
  })

  describe('active vs inactive state', () => {
    it('applies active background class when active=true', async () => {
      const { container } = await render(<NavItem {...baseProps} active />)
      expect(container.firstChild).toHaveClass('bg-surface-2')
    })

    it('does not apply active background class when active=false', async () => {
      const { container } = await render(<NavItem {...baseProps} active={false} />)
      expect(container.firstChild).not.toHaveClass('bg-surface-2')
    })

    it('renders the accent bar indicator when active', async () => {
      const { container } = await render(<NavItem {...baseProps} active />)
      const accentBar = container.querySelector('.bg-accent')
      expect(accentBar).toBeInTheDocument()
    })

    it('does not render the accent bar when inactive', async () => {
      const { container } = await render(<NavItem {...baseProps} active={false} />)
      const accentBar = container.querySelector('.bg-accent')
      expect(accentBar).toBeNull()
    })

    it('applies muted text class when inactive', async () => {
      const { container } = await render(<NavItem {...baseProps} />)
      expect(container.firstChild).toHaveClass('text-foreground-muted')
    })

    it('applies foreground text class when active', async () => {
      const { container } = await render(<NavItem {...baseProps} active />)
      expect(container.firstChild).toHaveClass('text-foreground')
    })
  })

  describe('count badge', () => {
    it('renders the count badge when count is provided', async () => {
      await render(<NavItem {...baseProps} count={5} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('renders count badge when count is 0', async () => {
      await render(<NavItem {...baseProps} count={0} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('does not render count badge when count is undefined', async () => {
      const { container } = await render(<NavItem {...baseProps} />)
      // badge is a span with specific font-mono class inside; count undefined means no badge
      const badges = container.querySelectorAll('.rounded-full.border')
      expect(badges).toHaveLength(0)
    })

    it('applies danger style to badge when alert is true and not active', async () => {
      const { container } = await render(<NavItem {...baseProps} count={3} alert />)
      const badge = container.querySelector('.text-danger')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('onClick', () => {
    it('calls onClick when the item is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      await render(<NavItem {...baseProps} onClick={onClick} />)
      await user.click(screen.getByText('Inicio'))
      expect(onClick).toHaveBeenCalledOnce()
    })

    it('does not throw when onClick is not provided', async () => {
      const user = userEvent.setup()
      await render(<NavItem {...baseProps} />)
      await expect(user.click(screen.getByText('Inicio'))).resolves.not.toThrow()
    })
  })
})
