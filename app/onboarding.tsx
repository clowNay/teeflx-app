import { useAuth } from '@/context/AuthContext'
import { api, PRODUCTION_API_HOST } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const CHECKOUT_URL = 'https://www.teeflx.com/checkout'

interface SeasonPass {
  id: string
  name: string
  title: string | null
  price: { value: string; currency: string }
  description: string | null
  type: 'FULL' | 'SPLIT'
  maxSplits: number | null
}

interface Season {
  playEndsAt: string
}

interface SeasonResponse {
  seasonYear: number
  season: Season | null
  seasonPasses: SeasonPass[]
}

// ── Pricing helpers (ported from teeflx-golfer) ───────────────────────────────

function getSplitPrice(pass: SeasonPass): number {
  return parseFloat(pass.price.value) / (pass.maxSplits ?? 7)
}

function getRemainingSeasonMonths(maxSplits: number = 7, seasonEndMonth: number = 9): number {
  const currentMonth = new Date().getMonth() // 0-indexed
  const startMonth = seasonEndMonth - maxSplits + 1
  if (currentMonth >= startMonth && currentMonth <= seasonEndMonth) {
    return seasonEndMonth - currentMonth + 1
  }
  return maxSplits // pre-season — all installments apply
}

function formatPrice(value: number): string {
  return value.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const PERKS = [
  { icon: 'golf-outline' as const,          label: 'Spil på alle samarbejdsklubber' },
  { icon: 'qr-code-outline' as const,       label: 'Digitalt medlemskort med QR-kode' },
  { icon: 'wallet-outline' as const,        label: 'Tjen wallet-kredit via præstationer' },
  { icon: 'people-outline' as const,        label: 'Henvis venner og tjen 250 kr. pr. ven' },
]
// ─────────────────────────────────────────────────────────────────────────────

function PlanCard({ pass, allPasses, seasonEndMonth }: {
  pass: SeasonPass
  allPasses: SeasonPass[]
  seasonEndMonth: number
}) {
  const isSplit = pass.type === 'SPLIT'
  const isFull = pass.type === 'FULL'
  const maxSplits = pass.maxSplits ?? 7
  const remaining = getRemainingSeasonMonths(maxSplits, seasonEndMonth)

  const monthlyPrice = isSplit ? getSplitPrice(pass) : null
  const splitTotal = monthlyPrice !== null ? monthlyPrice * remaining : null
  const fullPrice = isFull ? parseFloat(pass.price.value) : null

  // Savings vs split total (only shown on FULL card when SPLIT also exists)
  const splitPass = allPasses.find(p => p.type === 'SPLIT')
  const savings = isFull && splitPass
    ? Math.max(0, getSplitPrice(splitPass) * getRemainingSeasonMonths(splitPass.maxSplits ?? 7, seasonEndMonth) - (fullPrice ?? 0))
    : 0

  return (
    <View style={{
      flex: 1,
      backgroundColor: isFull ? '#14532d' : '#1a1a1a',
      borderRadius: 16,
      padding: 16,
      borderWidth: isFull ? 1 : 0,
      borderColor: '#16a34a',
    }}>
      <Text style={{ color: isFull ? '#86efac' : '#6b7280', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        {isSplit ? 'Månedlig' : 'Fuld betaling'}
      </Text>

      {isSplit && monthlyPrice !== null ? (
        <>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
            {formatPrice(monthlyPrice)}
            <Text style={{ color: '#9ca3af', fontSize: 13, fontWeight: 'normal' }}> kr./md</Text>
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 6, lineHeight: 16 }}>
            {remaining} rater · {formatPrice(splitTotal!)} kr. i alt
          </Text>
        </>
      ) : (
        <>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
            {formatPrice(fullPrice!)}
            <Text style={{ color: '#9ca3af', fontSize: 13, fontWeight: 'normal' }}> kr.</Text>
          </Text>
          <Text style={{ color: '#86efac', fontSize: 11, marginTop: 6 }}>Én betaling nu</Text>
          {savings > 0 && (
            <View style={{
              marginTop: 10, alignSelf: 'flex-start',
              backgroundColor: '#16a34a', borderRadius: 6,
              paddingHorizontal: 8, paddingVertical: 3,
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                SPAR {formatPrice(savings)} KR.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  )
}

export default function OnboardingScreen() {
  const { player, signOut } = useAuth()
  const [seasonData, setSeasonData] = useState<SeasonResponse | null>(null)
  const passes = seasonData?.seasonPasses ?? []
  const seasonEndMonth = seasonData?.season?.playEndsAt
    ? new Date(seasonData.season.playEndsAt).getMonth()
    : 9 // fallback: October

  const firstName = player?.name?.split(' ')[0] ?? 'Golfer'

  useEffect(() => {
    const unionId = player?.unionId
    const query = unionId ? `?unionId=${encodeURIComponent(unionId)}` : ''
    api.get<SeasonResponse>(`/v2/seasons/current${query}`)
      .then(data => setSeasonData(data))
      .catch(() => {})
  }, [player?.unionId])

  async function handleSignup() {
    let url = CHECKOUT_URL

    // Mint a short-lived handoff token so the web app can log the player in
    // automatically — they're already authenticated here, no need to go
    // through DGU OAuth again.
    try {
      const token = player?.dguAccessToken
      if (token) {
        // Always hit the production API — the web checkout exchanges the token
        // there, so the mint must happen on the same server instance.
        const res = await fetch(`${PRODUCTION_API_HOST}/oauth/handoff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        })
        const { handoffToken } = await res.json() as { handoffToken: string }
        url = `${CHECKOUT_URL}?handoff=${handoffToken}`
      }
    } catch {
      // Failed to mint token — open checkout without auto-login.
      // The player will see the normal login prompt.
    }

    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    })
  }

  function handleSignOut() {
    Alert.alert('Log ud', 'Er du sikker på, at du vil logge ud?', [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Log ud', style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0c0c0c' }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 48, height: 48, borderRadius: 12 }}
          />
          <View>
            <Text style={{ color: '#9ca3af', fontSize: 13 }}>Velkommen til TEEFLX</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Hej, {firstName}! 👋</Text>
          </View>
        </View>

        {/* Missing pass banner */}
        <View style={{
          backgroundColor: '#1a1a1a',
          borderRadius: 16,
          padding: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginBottom: 28,
          borderWidth: 1,
          borderColor: '#2d2d2d',
        }}>
          <View style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: '#292524',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Ionicons name="lock-closed-outline" size={22} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 2 }}>
              Intet aktivt sæsonkort
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 13, lineHeight: 18 }}>
              Du skal købe et sæsonkort for at spille i samarbejdsklubberne.
            </Text>
          </View>
        </View>

        {/* What you get */}
        <Text style={{ color: '#6b7280', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
          Hvad du får
        </Text>
        <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 18, marginBottom: 28, gap: 14 }}>
          {PERKS.map((perk, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: '#14532d',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Ionicons name={perk.icon} size={18} color="#16a34a" />
              </View>
              <Text style={{ color: '#d1d5db', fontSize: 14, flex: 1 }}>{perk.label}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        {passes.length > 0 && (
          <>
            <Text style={{ color: '#6b7280', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
              Tilgængelige sæsonkort
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
              {passes.map(pass => (
                <PlanCard key={pass.id} pass={pass} allPasses={passes} seasonEndMonth={seasonEndMonth} />
              ))}
            </View>
          </>
        )}

        {/* CTA */}
        <Pressable
          onPress={handleSignup}
          className="bg-green-700 rounded-2xl py-4 flex-row items-center justify-center gap-2 mb-3 active:opacity-75"
        >
          <Text className="text-white font-bold text-base">
            Køb sæsonkort på teeflx.com
          </Text>
          <Ionicons name="arrow-up-right-box-outline" size={20} color="#fff" />
        </Pressable>

        <Text className="text-gray-600 text-xs text-center mb-6">
          Genstart appen efter køb for at aktivere dit kort.
        </Text>

        <Pressable
          onPress={handleSignOut}
          className='flex-row items-center justify-center'
          style={({ pressed }) => ({ alignItems: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ color: '#4b5563', fontSize: 13 }}>Log ud</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
