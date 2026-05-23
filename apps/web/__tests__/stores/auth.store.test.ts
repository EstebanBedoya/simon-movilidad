import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth.store'
import type { AuthUser } from '@/types/auth.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'driver@simon.co',
    role: 'user',
    ...overrides,
  }
}

const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'

// ---------------------------------------------------------------------------
// Reset store and storage between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Clear persisted storage to avoid bleed between tests
  localStorage.clear()
  // Clear cookies
  document.cookie = 'simon_token=; path=/; max-age=0'

  // Reset to initial state
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
})

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

describe('useAuthStore — login', () => {
  it('sets the token in store state', () => {
    useAuthStore.getState().login(TEST_TOKEN, makeUser())

    expect(useAuthStore.getState().token).toBe(TEST_TOKEN)
  })

  it('sets the user in store state', () => {
    const user = makeUser({ id: 'user-42', email: 'admin@simon.co', role: 'admin' })
    useAuthStore.getState().login(TEST_TOKEN, user)

    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('sets isAuthenticated to true', () => {
    useAuthStore.getState().login(TEST_TOKEN, makeUser())

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('writes the simon_token cookie', () => {
    useAuthStore.getState().login(TEST_TOKEN, makeUser())

    expect(document.cookie).toContain(`simon_token=${TEST_TOKEN}`)
  })
})

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

describe('useAuthStore — logout', () => {
  it('clears the token from store state', () => {
    useAuthStore.getState().login(TEST_TOKEN, makeUser())
    useAuthStore.getState().logout()

    expect(useAuthStore.getState().token).toBeNull()
  })

  it('clears the user from store state', () => {
    useAuthStore.getState().login(TEST_TOKEN, makeUser())
    useAuthStore.getState().logout()

    expect(useAuthStore.getState().user).toBeNull()
  })

  it('sets isAuthenticated to false', () => {
    useAuthStore.getState().login(TEST_TOKEN, makeUser())
    useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('clears the simon_token cookie', () => {
    useAuthStore.getState().login(TEST_TOKEN, makeUser())
    useAuthStore.getState().logout()

    // After logout the cookie should not carry the token value
    // jsdom represents expired cookies as absent or empty-valued
    const cookieValue = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('simon_token='))

    // Either the cookie is gone or its value is empty (max-age=0 removes it)
    expect(cookieValue === undefined || cookieValue === 'simon_token=').toBe(true)
  })
})

// ---------------------------------------------------------------------------
// State isolation (persist middleware)
// ---------------------------------------------------------------------------

describe('useAuthStore — localStorage isolation', () => {
  it('starts with clean state when localStorage is cleared between tests', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
