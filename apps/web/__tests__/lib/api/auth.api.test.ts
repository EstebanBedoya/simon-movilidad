import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { login, me } from '@/lib/api/auth.api'
import type { AuthTokenPayload, AuthUser } from '@/types/auth.types'

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ token: null, logout: vi.fn() })),
  },
}))

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const mockUser: AuthUser = {
  id: 'u1',
  email: 'admin@simon.co',
  role: 'admin',
}

const mockTokenPayload: AuthTokenPayload = {
  access_token: 'jwt-abc-123',
  expires_in: 3600,
  user: mockUser,
}

describe('login', () => {
  it('calls POST /auth/login with credentials and returns token payload', async () => {
    let capturedBody: unknown
    server.use(
      http.post('*/auth/login', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockTokenPayload)
      })
    )

    const result = await login('admin@simon.co', 'secret')

    expect(capturedBody).toEqual({ email: 'admin@simon.co', password: 'secret' })
    expect(result).toEqual(mockTokenPayload)
  })

  it('uses POST method', async () => {
    let capturedMethod: string | undefined
    server.use(
      http.post('*/auth/login', ({ request }) => {
        capturedMethod = request.method
        return HttpResponse.json(mockTokenPayload)
      })
    )

    await login('admin@simon.co', 'secret')

    expect(capturedMethod).toBe('POST')
  })
})

describe('me', () => {
  it('calls GET /auth/me and returns the authenticated user', async () => {
    server.use(
      http.get('*/auth/me', () => HttpResponse.json(mockUser))
    )

    const result = await me()

    expect(result).toEqual(mockUser)
  })
})
