import { io, Socket } from 'socket.io-client'
import { secureStorage } from '../storage/secure'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

const sockets = new Map<string, Socket>()

export async function getSocket(namespace: string): Promise<Socket> {
  const key = namespace

  const existing = sockets.get(key)
  if (existing?.connected) return existing
  if (existing) {
    existing.disconnect()
    sockets.delete(key)
  }

  const token = await secureStorage.getToken()

  const socket = io(`${BASE_URL}${namespace}`, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  })

  sockets.set(key, socket)
  return socket
}

export function disconnectSocket(namespace: string): void {
  const socket = sockets.get(namespace)
  if (socket) {
    socket.disconnect()
    sockets.delete(namespace)
  }
}

export function disconnectAll(): void {
  for (const [, socket] of sockets) {
    socket.disconnect()
  }
  sockets.clear()
}
