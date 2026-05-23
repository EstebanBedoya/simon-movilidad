import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils'
import { OfflineStrip } from '@/components/molecules/OfflineStrip/OfflineStrip'
import { useConnectivityStore } from '@/stores/connectivity.store'

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: false, wsStatus: 'DISCONNECTED', lastSyncAt: null })
})

describe('OfflineStrip', () => {
  it('renders without crashing', async () => {
    const { container } = await render(<OfflineStrip />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('shows "Modo offline" heading', async () => {
    await render(<OfflineStrip />)
    expect(screen.getByText('Modo offline')).toBeInTheDocument()
  })

  it('shows cache message when lastSyncAt is null', async () => {
    await render(<OfflineStrip />)
    expect(screen.getByText(/sin sincronización/)).toBeInTheDocument()
  })

  it('shows elapsed sync time when lastSyncAt is set', async () => {
    useConnectivityStore.setState({ lastSyncAt: Date.now() - 5000 })
    await render(<OfflineStrip />)
    expect(screen.getByText(/últ\. sync/)).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', async () => {
    await render(<OfflineStrip onRetry={vi.fn()} />)
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('does not render retry button when onRetry is not provided', async () => {
    await render(<OfflineStrip />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    await render(<OfflineStrip onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
