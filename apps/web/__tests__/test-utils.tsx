/**
 * Test utilities for React 19 + @testing-library/react.
 *
 * React 19's act() is always async (returns a thenable even for sync callbacks).
 * @testing-library/react v16 does not await the thenable when the render callback
 * returns void, so the DOM never flushes synchronously.
 *
 * This file re-exports everything from @testing-library/react but provides an
 * async `render` wrapper that correctly awaits the flush.
 */
import { act, render as tlRender, type RenderOptions, type RenderResult } from '@testing-library/react'
import { type ReactElement } from 'react'

export * from '@testing-library/react'

export async function render(ui: ReactElement, options?: RenderOptions): Promise<RenderResult> {
  let result!: RenderResult
  await act(async () => {
    result = tlRender(ui, options)
  })
  return result
}
