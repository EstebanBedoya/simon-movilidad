import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth.store'
import { useConnectivityStore } from '@/stores/connectivity.store'

const sockets: Map<string, Socket> = new Map()

export function getSocket(namespace: string): Socket {
  if (sockets.has(namespace)) {
    return sockets.get(namespace)!
  }

  const token = useAuthStore.getState().token
  const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}${namespace}`, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
  })

  socket.on('connect', () => {
    useConnectivityStore.getState().setWsStatus('LIVE')
  })

  socket.on('disconnect', () => {
    useConnectivityStore.getState().setWsStatus('RECONNECTING')
  })

  socket.on('connect_error', () => {
    useConnectivityStore.getState().setWsStatus('DISCONNECTED')
  })

  sockets.set(namespace, socket)
  return socket
}

export function disconnectSocket(namespace: string): void {
  const socket = sockets.get(namespace)
  if (socket) {
    socket.disconnect()
    sockets.delete(namespace)
  }
}
