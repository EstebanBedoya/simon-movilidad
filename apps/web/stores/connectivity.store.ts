import { create } from 'zustand'

type WsStatus = 'LIVE' | 'RECONNECTING' | 'DISCONNECTED'

interface ConnectivityState {
  isOnline: boolean
  wsStatus: WsStatus
  lastSyncAt: number | null
}

interface ConnectivityActions {
  setOnline: (v: boolean) => void
  setWsStatus: (s: WsStatus) => void
  markSynced: () => void
}

export const useConnectivityStore = create<ConnectivityState & ConnectivityActions>()((set) => ({
  isOnline: true,
  wsStatus: 'LIVE',
  lastSyncAt: null,
  setOnline: (isOnline) => set((state) => ({
    isOnline,
    lastSyncAt: isOnline && !state.isOnline ? Date.now() : state.lastSyncAt,
  })),
  setWsStatus: (wsStatus) => set({ wsStatus }),
  markSynced: () => set({ lastSyncAt: Date.now() }),
}))
