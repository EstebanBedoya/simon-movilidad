import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test-utils'
import { NavBrand } from '@/components/molecules/NavBrand/NavBrand'

describe('NavBrand', () => {
  it('renders without crashing', async () => {
    const { container } = await render(<NavBrand />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders the brand name "simón"', async () => {
    await render(<NavBrand />)
    // The text node "simón" lives inside a span alongside the dot span
    expect(screen.getByText(/simón/)).toBeInTheDocument()
  })

  it('renders the version subtitle', async () => {
    await render(<NavBrand />)
    expect(screen.getByText(/Fleet Ops/)).toBeInTheDocument()
  })

  it('renders the logo letter "S"', async () => {
    await render(<NavBrand />)
    expect(screen.getByText('S')).toBeInTheDocument()
  })
})
