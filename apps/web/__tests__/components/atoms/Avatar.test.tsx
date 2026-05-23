import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test-utils'
import { Avatar } from '@/components/atoms/Avatar/Avatar'

describe('Avatar', () => {
  it('renders the initials text', async () => {
    await render(<Avatar initials="AB" />)
    expect(screen.getByText('AB')).toBeInTheDocument()
  })

  it('renders a span element', async () => {
    const { container } = await render(<Avatar initials="CD" />)
    expect(container.querySelector('span')).not.toBeNull()
  })

  it('renders a single-character initial', async () => {
    await render(<Avatar initials="Z" />)
    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('applies base layout classes', async () => {
    const { container } = await render(<Avatar initials="EF" />)
    expect(container.firstChild).toHaveClass('rounded-full')
    expect(container.firstChild).toHaveClass('grid')
    expect(container.firstChild).toHaveClass('place-items-center')
  })
})
