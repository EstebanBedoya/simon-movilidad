import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import NetInfo from '@react-native-community/netinfo'
import { useAuthStore } from '../stores/auth.store'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 2,
    },
  },
})

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected ?? true)
  })
})

function AuthGuard() {
  const { isAuthenticated } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    const inAuthGroup = segments[0] === '(tabs)'

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login')
    } else if (isAuthenticated && segments[0] === 'login') {
      router.replace('/(tabs)/map')
    }
  }, [isAuthenticated, segments])

  return null
}

export default function RootLayout() {
  // Font files must be placed in assets/fonts/ before building.
  // During dev iteration without the font assets, remove the font map entries below.
  const [fontsLoaded, fontError] = useFonts({
    // Geist: require('../assets/fonts/Geist-Regular.otf'),
    // 'Geist-Medium': require('../assets/fonts/Geist-Medium.otf'),
    // 'Geist-SemiBold': require('../assets/fonts/Geist-SemiBold.otf'),
    // 'Geist-Bold': require('../assets/fonts/Geist-Bold.otf'),
    // GeistMono: require('../assets/fonts/GeistMono-Regular.otf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
      </Stack>
    </QueryClientProvider>
  )
}
