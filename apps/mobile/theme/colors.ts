export const colors = {
  bg: '#050505',
  surface1: '#0c0c0d',
  surface2: '#131315',
  surface3: '#1a1a1d',

  hairline: 'rgba(255,255,255,0.06)',
  hairlineStrong: 'rgba(255,255,255,0.12)',

  foreground: '#f5f5f5',
  foregroundMuted: 'rgba(245,245,245,0.55)',
  foregroundDim: 'rgba(245,245,245,0.35)',

  accent: '#d4ff3d',
  accentSoft: 'rgba(212,255,61,0.12)',
  accentLine: 'rgba(212,255,61,0.32)',

  danger: '#ff4d5e',
  warning: '#ffb547',
  success: '#2bd67b',
  info: '#5aa9ff',

  statusActive: '#d4ff3d',
  statusIdle: '#ffb547',
  statusAlert: '#ff4d5e',
  statusOffline: 'rgba(255,255,255,0.25)',
} as const

export type ColorToken = keyof typeof colors
