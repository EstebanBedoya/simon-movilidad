import { Tabs } from 'expo-router'
import { colors } from '../../theme'
import { useAuthStore } from '../../stores/auth.store'
import { useAlertsStore } from '../../stores/alerts.store'

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const unresolvedCount = useAlertsStore((s) => s.alerts.filter((a) => !a.resolved).length)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface1,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.foregroundMuted,
        tabBarLabelStyle: {
          fontFamily: 'Geist-Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            null
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: () => null,
          href: isAdmin ? '/(tabs)/alerts' : null,
          tabBarBadge: unresolvedCount > 0 ? unresolvedCount : undefined,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  )
}
