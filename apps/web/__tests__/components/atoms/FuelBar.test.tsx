import { describe, it, expect } from 'vitest'
import { render } from '../../test-utils'
import { FuelBar } from '@/components/atoms/FuelBar/FuelBar'

describe('FuelBar', () => {
  it('renders the track container', async () => {
    const { container } = await render(<FuelBar value={50} />)
    expect(container.firstChild).toHaveClass('bg-surface-3')
  })

  it('sets the fill width as an inline style', async () => {
    const { container } = await render(<FuelBar value={72} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('72%')
  })

  it("applies 'danger' fill color when value < 15", async () => {
    const { container } = await render(<FuelBar value={10} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill).toHaveClass('bg-danger')
  })

  it("applies 'danger' fill color at boundary value 14", async () => {
    const { container } = await render(<FuelBar value={14} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill).toHaveClass('bg-danger')
  })

  it("applies 'warn' fill color when value is in [15, 35)", async () => {
    const { container } = await render(<FuelBar value={25} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill).toHaveClass('bg-warning')
  })

  it("applies 'warn' fill color at boundary value 15", async () => {
    const { container } = await render(<FuelBar value={15} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill).toHaveClass('bg-warning')
  })

  it("applies 'ok' (accent) fill color when value >= 35", async () => {
    const { container } = await render(<FuelBar value={50} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill).toHaveClass('bg-accent')
  })

  it("applies 'ok' fill color at boundary value 35", async () => {
    const { container } = await render(<FuelBar value={35} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill).toHaveClass('bg-accent')
  })

  it('works at 0% (empty tank)', async () => {
    const { container } = await render(<FuelBar value={0} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('0%')
    expect(fill).toHaveClass('bg-danger')
  })

  it('works at 100% (full tank)', async () => {
    const { container } = await render(<FuelBar value={100} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('100%')
    expect(fill).toHaveClass('bg-accent')
  })
})
