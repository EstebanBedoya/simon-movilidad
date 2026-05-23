'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login as apiLogin } from '@/lib/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

export default function LoginPage() {
  const router = useRouter()
  const authLogin = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = await apiLogin(email, password)
      authLogin(payload.access_token, payload.user)
      router.replace('/dashboard')
    } catch {
      setError('Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-hairline bg-surface-1 shadow-lg">
        <h1 className="text-xl font-semibold mb-1">Simón Movilidad</h1>
        <p className="text-sm text-foreground-muted mb-6">Ingresa tus credenciales para continuar</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="px-3 py-2 rounded-lg border border-hairline bg-bg text-sm outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground-muted">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="px-3 py-2 rounded-lg border border-hairline bg-bg text-sm outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-2 px-4 rounded-lg bg-accent text-bg text-sm font-semibold transition-opacity disabled:opacity-50"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
