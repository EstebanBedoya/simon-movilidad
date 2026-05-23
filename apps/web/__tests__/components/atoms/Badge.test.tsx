import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test-utils'
import { Badge } from '@/components/atoms/Badge/Badge'

describe('Badge', () => {
  it('renders null when count is 0', async () => {
    const { container } = await render(<Badge count={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the count when it is greater than 0', async () => {
    await render(<Badge count={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders a span element when count is positive', async () => {
    const { container } = await render(<Badge count={1} />)
    expect(container.querySelector('span')).not.toBeNull()
  })

  it('displays large numbers', async () => {
    await render(<Badge count={99} />)
    expect(screen.getByText('99')).toBeInTheDocument()
  })
})
