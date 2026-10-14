import { API_HOST } from '@/lib/api'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Image, Pressable, View } from 'react-native'
import { Text } from '@/components/Text'
import { FLX } from '@/lib/theme'

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
        <Text style={{ color: FLX.mistDim, fontSize: 15, textAlign: 'center' }}>
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
            <Text className="text-flx-mist text-sm flex-1">{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Login button */}
      <View className="w-full gap-3">
        <Pressable
          onPress={handleLogin}
          className="bg-flx-gold rounded-full py-4 items-center active:opacity-80"
        >
          <Text className="text-flx-green font-bold text-base">Login med DGU</Text>
        </Pressable>
        <Text className="text-flx-mist-dim text-xs text-center">
          Du logger ind med dit DGU-nummer og password
        </Text>

        {/* Club staff scanner link */}
        <Pressable
          onPress={() => router.push('/scan')}
          style={{ backgroundColor: FLX.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: FLX.line, marginTop: 32 }}
        >
          <Text style={{ color: FLX.mistDim, fontSize: 14, fontWeight: '600' }}>
            Klubpersonale?{' '}
            <Text style={{ color: FLX.gold }}>Åbn kortscanner</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
