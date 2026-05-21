import '../global.css'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'

SplashScreen.preventAutoHideAsync()

function AuthGate() {
  const { isLoading, isAuthenticated, player } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  // Player has a usable pass if they have at least one ACTIVE or UPCOMING pass
  const hasPass = player?.playerSeasonPasses?.some(
    p => p.status === 'ACTIVE' || p.status === 'UPCOMING'
  ) ?? false

  useEffect(() => {
    if (isLoading) return
    SplashScreen.hideAsync()

    const inAuthGroup = segments[0] === '(tabs)'
    const inOAuth = segments[0] === 'oauth'
    const inScan = segments[0] === 'scan'
    const inOnboarding = segments[0] === 'onboarding'

    if (!isAuthenticated) {
      // Not logged in — send to login unless already on a public route
      if (inAuthGroup || inOnboarding) router.replace('/login')
    } else if (!hasPass) {
      // Logged in but no pass — send to onboarding, block tabs
      if (!inOnboarding) router.replace('/onboarding')
    } else {
      // Fully active player — send to tabs
      if (!inAuthGroup && !inOAuth && !inScan) router.replace('/(tabs)/')
    }
  }, [isLoading, isAuthenticated, hasPass, segments])

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0c0c0c' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="oauth/callback" />
      <Stack.Screen name="scan" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
