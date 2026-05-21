import { API_HOST } from '@/lib/api'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Image, Pressable, Text, View } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const router = useRouter()

  async function handleLogin() {
    const url = `${API_HOST}/oauth/authorize?mobile=true`
    const result = await WebBrowser.openAuthSessionAsync(url, 'teeflx://oauth/callback')

    if (result.type === 'success' && result.url) {
      const parsed = new URL(result.url)
      const token = parsed.searchParams.get('token') ?? undefined
      const state = parsed.searchParams.get('state') ?? undefined
      router.replace({ pathname: '/oauth/callback', params: { token, state } })
    }
  }

  return (
    <View className="flex-1 bg-bg items-center justify-between px-8 pb-12 pt-24">
      {/* Logo area */}
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 88, height: 88, borderRadius: 20 }}
        />
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: 4 }}>TEEFLX</Text>
        <Text style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center' }}>
          Dit digitale sæsonkort til alle{'\n'}samarbejdsklubber
        </Text>
      </View>

      {/* Feature bullets */}
      <View className="gap-4 w-full">
        {[
          { icon: '🎫', label: 'Digitalt sæsonkort med QR-kode' },
          { icon: '🏌️', label: 'Spil i alle samarbejdsklubber' },
          { icon: '🏆', label: 'Tjen wallet-kredit via præstationer' },
          { icon: '👥', label: 'Henvis venner og tjen 250 kr. per ven' },
        ].map((f) => (
          <View key={f.icon} className="flex-row items-center gap-3">
            <Text className="text-2xl">{f.icon}</Text>
            <Text className="text-gray-300 text-sm flex-1">{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Login button */}
      <View className="w-full gap-3">
        <Pressable
          onPress={handleLogin}
          className="bg-brand-600 rounded-2xl py-4 items-center active:opacity-80"
        >
          <Text className="text-white font-bold text-base">Login med DGU</Text>
        </Pressable>
        <Text className="text-gray-600 text-xs text-center">
          Du logger ind med dit DGU-nummer og password
        </Text>

        {/* Club staff scanner link */}
        <Pressable
          onPress={() => router.push('/scan')}
          style={{ backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2d2d2d', marginTop: 32 }}
        >
          <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600' }}>
            Klubpersonale?{' '}
            <Text style={{ color: '#16a34a' }}>Åbn kortscanner</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
