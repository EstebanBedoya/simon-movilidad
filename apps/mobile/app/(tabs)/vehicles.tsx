import { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Vehicle, Alert } from '@simon/types'
import { deriveUiStatus, type UIVehicleStatus } from '@simon/types'
import { useVehicles } from '../../hooks/use-vehicles'
import { useAlertsStore } from '../../stores/alerts.store'
import { colors, fontSize, fontWeight, spacing, radius } from '../../theme'

const statusColorMap: Record<UIVehicleStatus, string> = {
  active: colors.statusActive,
  idle: colors.statusIdle,
  alert: colors.statusAlert,
  offline: colors.statusOffline,
}

function maskDeviceId(deviceId: string): string {
  if (deviceId.length <= 8) return deviceId
  return `${deviceId.slice(0, 4)}****${deviceId.slice(-4)}`
}

function VehicleRow({ vehicle, alerts }: { vehicle: Vehicle; alerts: Alert[] }) {
  const vehicleAlerts = alerts.filter((a) => a.vehicle_id === vehicle.id)
  const status = deriveUiStatus(vehicle, vehicleAlerts)
  const telem = vehicle.latest_telemetry

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: statusColorMap[status] }]} />
      <View style={styles.rowContent}>
        <Text style={styles.vehicleName}>{vehicle.name}</Text>
        <Text style={styles.vehicleMeta}>
          {vehicle.city} · {maskDeviceId(vehicle.device_id)}
        </Text>
        {telem ? (
          <Text style={styles.vehicleMetrics}>
            {telem.speed} km/h · {telem.fuel_level}% · {telem.temperature}°C
          </Text>
        ) : null}
      </View>
    </View>
  )
}

export default function VehiclesScreen() {
  const { vehicles, isLoading, refetch } = useVehicles()
  const alerts = useAlertsStore((s) => s.alerts)
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Fleet</Text>
        <Text style={styles.subtitle}>{vehicles.length} vehicles</Text>
      </View>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VehicleRow vehicle={item} alerts={alerts} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Geist-Bold',
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  subtitle: {
    fontFamily: 'Geist',
    fontSize: fontSize.sm,
    color: colors.foregroundMuted,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    marginTop: 4,
    marginRight: spacing.md,
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: spacing.xs,
  },
  vehicleName: {
    fontFamily: 'Geist-SemiBold',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  vehicleMeta: {
    fontFamily: 'Geist',
    fontSize: fontSize.sm,
    color: colors.foregroundMuted,
  },
  vehicleMetrics: {
    fontFamily: 'Geist',
    fontSize: fontSize.xs,
    color: colors.foregroundDim,
  },
  separator: {
    height: 1,
    backgroundColor: colors.hairline,
  },
})
