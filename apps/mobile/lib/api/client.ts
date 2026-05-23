import { secureStorage } from '../storage/secure'
import { useAuthStore } from '../../stores/auth.store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL

if (!BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not defined')
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  const { params, ...fetchOptions } = options

  let url = `${BASE_URL}${path}`
  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined) searchParams.set(key, String(val))
    }
    const qs = searchParams.toString()
    if (qs) url = `${url}?${qs}`
  }

  const token = await secureStorage.getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(url, { ...fetchOptions, headers })
  } catch {
    throw new ApiError('Network error', 0, 'NETWORK_ERROR')
  }

  if (response.status === 401) {
    useAuthStore.getState().logout()
    throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(body.message ?? `HTTP ${response.status}`, response.status, body.code)
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, options?: { params?: Record<string, string | number | boolean | undefined> }) =>
    request<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
