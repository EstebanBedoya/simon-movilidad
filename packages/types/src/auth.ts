export type UserRole = 'admin' | 'user'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface AuthTokenPayload {
  access_token: string
  expires_in: number
  user: AuthUser
}
