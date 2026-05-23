import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'
import type { AuthUser } from '@simon/types'
import { secureStorage } from '../lib/storage/secure'

const mmkv = new MMKV({ id: 'simon_auth' })

const mmkvStorage = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
}

interface AuthActions {
  login: (token: string, user: AuthUser) => Promise<void>
  logout: () => Promise<void>
  hydrate: (token: string, user: AuthUser) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (token, user) => {
        await secureStorage.setToken(token)
        set({ user, isAuthenticated: true })
      },

      logout: async () => {
        await secureStorage.removeToken()
        set({ user: null, isAuthenticated: false })
      },

      hydrate: (token, user) => {
        secureStorage.setToken(token)
        set({ user, isAuthenticated: true })
      },
    }),
    {
      name: 'simon_auth',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
