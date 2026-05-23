import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test-utils'
import { SearchBox } from '@/components/molecules/SearchBox/SearchBox'

describe('SearchBox', () => {
  it('renders without crashing', async () => {
    const { container } = await render(<SearchBox />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders a text input element', async () => {
    await render(<SearchBox />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('input has a placeholder text', async () => {
    await render(<SearchBox />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder')
  })

  it('renders the search icon container', async () => {
    const { container } = await render(<SearchBox />)
    // Lucide renders an SVG for the Search icon
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
