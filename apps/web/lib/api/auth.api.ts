import { apiClient } from './client'
import type { AuthTokenPayload, AuthUser } from '@/types/auth.types'

export async function login(email: string, password: string): Promise<AuthTokenPayload> {
  const { data } = await apiClient.post<AuthTokenPayload>('/auth/login', { email, password })
  return data
}

export async function me(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me')
  return data
}
