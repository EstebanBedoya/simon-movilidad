import { View, Text, Pressable } from 'react-native'
import { colors, fontSize, fontWeight, spacing, radius } from '../../theme'
import { useAuthStore } from '../../stores/auth.store'

export default function SettingsScreen() {
  const { user, logout } = useAuthStore()

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
        {user && (
          <View style={{ backgroundColor: colors.surface1, borderRadius: radius.md, borderCurve: 'continuous', padding: spacing.lg }}>
            <Text style={{ color: colors.foregroundMuted, fontSize: fontSize.xs, fontFamily: 'Geist', marginBottom: spacing.xs }}>
              Signed in as
            </Text>
            <Text style={{ color: colors.foreground, fontSize: fontSize.base, fontFamily: 'Geist-Medium', fontWeight: fontWeight.medium }}>
              {user.email}
            </Text>
            <Text style={{ color: colors.accent, fontSize: fontSize.xs, fontFamily: 'Geist', marginTop: spacing.xs }}>
              {user.role}
            </Text>
          </View>
        )}

        <Pressable
          onPress={logout}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.surface2 : colors.surface1,
            borderRadius: radius.md,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: colors.danger,
            padding: spacing.lg,
            alignItems: 'center',
          })}
        >
          <Text style={{ color: colors.danger, fontSize: fontSize.base, fontFamily: 'Geist-Medium', fontWeight: fontWeight.medium }}>
            Sign out
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
