import { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Alert, AlertType } from '@simon/types'
import { resolveAlert as resolveAlertApi } from '../../lib/api/alerts.api'
import { useAlerts } from '../../hooks/use-alerts'
import { useAlertsStore } from '../../stores/alerts.store'
import { useAuthStore } from '../../stores/auth.store'
import { colors, fontSize, fontWeight, spacing, radius } from '../../theme'

const TYPE_LABELS: Record<AlertType, string> = {
  low_fuel: 'Low fuel',
  high_temperature: 'High temp',
  speeding: 'Speeding',
  offline: 'Offline',
}

const TYPE_COLORS: Record<AlertType, string> = {
  low_fuel: colors.warning,
  high_temperature: colors.danger,
  speeding: colors.info,
  offline: colors.foregroundMuted,
}

function elapsed(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function AlertRow({
  alert,
  isAdmin,
  onResolve,
}: {
  alert: Alert
  isAdmin: boolean
  onResolve: (id: string) => Promise<void>
}) {
  const [resolving, setResolving] = useState(false)
  const typeColor = TYPE_COLORS[alert.type]

  async function handleResolve() {
    setResolving(true)
    await onResolve(alert.id)
    setResolving(false)
  }

  return (
    <View style={[styles.row, alert.resolved && styles.rowResolved]}>
      <View style={styles.rowTop}>
        <View style={[styles.badge, { backgroundColor: typeColor + '33' }]}>
          <Text style={[styles.badgeText, { color: typeColor }]}>
            {TYPE_LABELS[alert.type]}
          </Text>
        </View>
        <Text style={styles.elapsed}>{elapsed(alert.created_at)}</Text>
      </View>
      <Text style={styles.vehicleName}>{alert.vehicle_name}</Text>
      <Text style={styles.message}>{alert.message}</Text>
      {isAdmin && !alert.resolved ? (
        <Pressable
          style={[styles.resolveButton, resolving && styles.resolveButtonDisabled]}
          onPress={handleResolve}
          disabled={resolving}
        >
          <Text style={styles.resolveButtonText}>
            {resolving ? 'Resolving…' : 'Resolve'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export default function AlertsScreen() {
  const { isLoading, refetch } = useAlerts()
  const alerts = useAlertsStore((s) => s.alerts)
  const resolveInStore = useAlertsStore((s) => s.resolveAlert)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const [refreshing, setRefreshing] = useState(false)

  const sorted = [...alerts].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const activeCount = alerts.filter((a) => !a.resolved).length

  async function handleResolve(id: string) {
    const result = await resolveAlertApi(id)
    resolveInStore(id, result.resolved_at)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>{activeCount} active</Text>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertRow alert={item} isAdmin={isAdmin} onResolve={handleResolve} />
        )}
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
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  rowResolved: {
    opacity: 0.5,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: 'Geist-Medium',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  elapsed: {
    fontFamily: 'Geist',
    fontSize: fontSize.xs,
    color: colors.foregroundDim,
  },
  vehicleName: {
    fontFamily: 'Geist-SemiBold',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  message: {
    fontFamily: 'Geist',
    fontSize: fontSize.sm,
    color: colors.foregroundMuted,
  },
  resolveButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentLine,
  },
  resolveButtonDisabled: {
    opacity: 0.5,
  },
  resolveButtonText: {
    fontFamily: 'Geist-Medium',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.accent,
  },
  separator: {
    height: 1,
    backgroundColor: colors.hairline,
  },
})
