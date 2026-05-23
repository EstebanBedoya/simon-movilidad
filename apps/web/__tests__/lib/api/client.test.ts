/**
 * Tests for lib/api/client.ts
 *
 * We mock the axios module so axios.create() returns a controlled instance,
 * then capture the interceptor handlers that client.ts registers and invoke
 * them directly. This avoids the jsdom/msw/XHR adapter mismatch.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ─── Hoist declarations that must be accessible inside vi.mock factories ───
const { mockToken, mockLogout, captured } = vi.hoisted(() => {
  interface MutableToken {
    value: string | null
  }
  interface Captured {
    requestHandler?: (config: { headers: Record<string, string> }) => { headers: Record<string, string> }
    responseErrorHandler?: (error: unknown) => Promise<never>
  }
  const mockToken: MutableToken = { value: null }
  const mockLogout = vi.fn()
  const captured: Captured = {}
  return { mockToken, mockLogout, captured }
})

// ─── Auth store mock ───────────────────────────────────────────────────────
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: () => ({ token: mockToken.value, logout: mockLogout }),
  },
}))

// ─── Axios mock — capture interceptor handlers ─────────────────────────────
vi.mock('axios', async (importOriginal) => {
  const original = await importOriginal<typeof import('axios')>()

  const mockInterceptors = {
    request: {
      use: (handler: NonNullable<typeof captured.requestHandler>) => {
        captured.requestHandler = handler
        return 0
      },
    },
    response: {
      use: (_ok: unknown, errHandler: NonNullable<typeof captured.responseErrorHandler>) => {
        captured.responseErrorHandler = errHandler
        return 0
      },
    },
  }

  const mockInstance = {
    interceptors: mockInterceptors,
    defaults: { headers: { common: {} } },
    get: vi.fn(),
    post: vi.fn(),
  }

  return {
    ...original,
    default: {
      ...original.default,
      create: vi.fn(() => mockInstance),
    },
  }
})

// Importing client.ts triggers axios.create() + interceptor registration
import '@/lib/api/client'

// ─── Setup / teardown ────────────────────────────────────────────────────────
beforeEach(() => {
  mockToken.value = null
  mockLogout.mockReset()
  Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

// ─── Request interceptor ─────────────────────────────────────────────────────
describe('apiClient — request interceptor', () => {
  it('injects Authorization header when a token exists', () => {
    mockToken.value = 'abc-123'
    const config = { headers: {} as Record<string, string> }

    const result = captured.requestHandler!(config)

    expect(result.headers['Authorization']).toBe('Bearer abc-123')
  })

  it('does not add an Authorization header when token is null', () => {
    mockToken.value = null
    const config = { headers: {} as Record<string, string> }

    const result = captured.requestHandler!(config)

    expect(result.headers['Authorization']).toBeUndefined()
  })
})

// ─── Response interceptor ────────────────────────────────────────────────────
describe('apiClient — response interceptor', () => {
  it('calls logout and redirects to /login on 401 response', async () => {
    const error = { response: { status: 401 } }

    await expect(captured.responseErrorHandler!(error)).rejects.toEqual(error)

    expect(mockLogout).toHaveBeenCalledOnce()
    expect(window.location.href).toBe('/login')
  })

  it('does not call logout on 403 errors', async () => {
    const error = { response: { status: 403 } }

    await expect(captured.responseErrorHandler!(error)).rejects.toEqual(error)

    expect(mockLogout).not.toHaveBeenCalled()
  })

  it('does not call logout when there is no response object (network error)', async () => {
    const error = new Error('Network error')

    await expect(captured.responseErrorHandler!(error)).rejects.toEqual(error)

    expect(mockLogout).not.toHaveBeenCalled()
  })

  it('always rejects — does not swallow the error', async () => {
    const error = { response: { status: 401 } }

    await expect(captured.responseErrorHandler!(error)).rejects.toBeDefined()
  })
})
