import { View } from 'react-native'
import { colors, radius } from '../../theme'
import type { UIVehicleStatus } from '@simon/types'

interface VehicleMarkerProps {
  status: UIVehicleStatus
  size?: number
}

const statusColor: Record<UIVehicleStatus, string> = {
  active: colors.statusActive,
  idle: colors.statusIdle,
  alert: colors.statusAlert,
  offline: colors.statusOffline,
}

export function VehicleMarker({ status, size = 14 }: VehicleMarkerProps) {
  const color = statusColor[status]

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        borderCurve: 'continuous',
        backgroundColor: color,
        borderWidth: 2,
        borderColor: colors.bg,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
  )
}
