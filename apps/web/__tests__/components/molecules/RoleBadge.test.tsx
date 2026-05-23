import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test-utils'
import { RoleBadge } from '@/components/molecules/RoleBadge/RoleBadge'

describe('RoleBadge', () => {
  const baseProps = {
    role: 'Admin',
    name: 'María García',
    initials: 'MG',
  }

  it('renders the role text', async () => {
    await render(<RoleBadge {...baseProps} />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders the name text', async () => {
    await render(<RoleBadge {...baseProps} />)
    expect(screen.getByText('María García')).toBeInTheDocument()
  })

  it('renders initials via the Avatar component', async () => {
    await render(<RoleBadge {...baseProps} />)
    expect(screen.getByText('MG')).toBeInTheDocument()
  })

  it('renders sub text when provided', async () => {
    await render(<RoleBadge {...baseProps} sub="Medellín" />)
    expect(screen.getByText(/Medellín/)).toBeInTheDocument()
  })

  it('does not render sub text when sub is omitted', async () => {
    await render(<RoleBadge {...baseProps} />)
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })

  it('applies accent color class to the role label', async () => {
    const { container } = await render(<RoleBadge {...baseProps} />)
    const roleEl = container.querySelector('.text-accent')
    expect(roleEl).toBeInTheDocument()
    expect(roleEl).toHaveTextContent('Admin')
  })
})
