import { create } from 'zustand'

type WsStatus = 'LIVE' | 'RECONNECTING' | 'DISCONNECTED'

interface ConnectivityState {
  isOnline: boolean
  wsStatus: WsStatus
}

interface ConnectivityActions {
  setOnline: (v: boolean) => void
  setWsStatus: (s: WsStatus) => void
}

export const useConnectivityStore = create<ConnectivityState & ConnectivityActions>()((set) => ({
  isOnline: true,
  wsStatus: 'LIVE',
  setOnline: (isOnline) => set({ isOnline }),
  setWsStatus: (wsStatus) => set({ wsStatus }),
}))
