import { useEffect } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'

// This screen is opened via deep link: teeflx://oauth/callback?token=...&state=...
export default function OAuthCallback() {
  const { token, state } = useLocalSearchParams<{ token?: string; state?: string }>()
  const { signIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function handle() {
      // state=2 → active player, state=7 → new player, state=3 → in registration
      const successStates = ['2', '3', '7']

      if (token && state && successStates.includes(state)) {
        await signIn(token)
        router.replace('/(tabs)/')
      } else {
        // Failed auth — back to login with a short delay
        setTimeout(() => router.replace('/login'), 1500)
      }
    }

    handle()
  }, [token, state])

  return (
    <View className="flex-1 bg-bg items-center justify-center gap-4">
      <ActivityIndicator size="large" color="#16a34a" />
      <Text className="text-gray-400 text-sm">Logger ind…</Text>
    </View>
  )
}
