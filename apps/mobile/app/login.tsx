import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Stack } from 'expo-router'
import { colors, fontSize, fontWeight, spacing, radius } from '../theme'
import { useAuthStore } from '../stores/auth.store'
import { apiClient } from '../lib/api/client'
import type { AuthTokenPayload } from '@simon/types'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  async function handleLogin() {
    if (!email.trim() || !password.trim()) return

    setLoading(true)
    try {
      const payload = await apiClient.post<AuthTokenPayload>('/auth/login', {
        email: email.trim(),
        password,
      })
      await login(payload.access_token, payload.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      Alert.alert('Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Login', headerShown: false }} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            flex: 1,
            justifyContent: 'center',
            padding: spacing.xl,
          }}
        >
          <View style={{ marginBottom: spacing.xxl }}>
            <Text
              style={{
                fontSize: fontSize.xxl,
                fontWeight: fontWeight.bold,
                color: colors.accent,
                fontFamily: 'Geist-Bold',
                letterSpacing: -0.5,
              }}
            >
              simón.
            </Text>
            <Text
              style={{
                fontSize: fontSize.base,
                color: colors.foregroundMuted,
                marginTop: spacing.xs,
                fontFamily: 'Geist',
              }}
            >
              Fleet management
            </Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.foregroundDim}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={{
                backgroundColor: colors.surface1,
                color: colors.foreground,
                borderRadius: radius.md,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: colors.hairline,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                fontSize: fontSize.base,
                fontFamily: 'Geist',
              }}
            />

            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.foregroundDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              style={{
                backgroundColor: colors.surface1,
                color: colors.foreground,
                borderRadius: radius.md,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: colors.hairline,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                fontSize: fontSize.base,
                fontFamily: 'Geist',
              }}
            />

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.accentLine : colors.accent,
                borderRadius: radius.md,
                borderCurve: 'continuous',
                paddingVertical: spacing.md,
                alignItems: 'center',
                marginTop: spacing.sm,
                opacity: loading ? 0.7 : 1,
              })}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text
                  style={{
                    color: colors.bg,
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.semibold,
                    fontFamily: 'Geist-SemiBold',
                  }}
                >
                  Sign in
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}
