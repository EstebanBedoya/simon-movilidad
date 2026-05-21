import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/auth.types'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
}

interface AuthActions {
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => {
        document.cookie = `simon_token=${token}; path=/; max-age=86400; SameSite=Lax`
        set({ token, user, isAuthenticated: true })
      },
      logout: () => {
        document.cookie = 'simon_token=; path=/; max-age=0'
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    { name: 'simon_auth' }
  )
)
