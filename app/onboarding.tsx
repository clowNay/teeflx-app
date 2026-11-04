import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { openGolferWeb } from '@/lib/web'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, View } from 'react-native'
import { Text } from '@/components/Text'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FLX } from '@/lib/theme'

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
      backgroundColor: isFull ? FLX.goldTint : FLX.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: isFull ? 1 : 0,
      borderColor: FLX.gold,
    }}>
      <Text style={{ color: isFull ? FLX.gold : FLX.mistDim, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        {isSplit ? 'Månedlig' : 'Fuld betaling'}
      </Text>

      {isSplit && monthlyPrice !== null ? (
        <>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
            {formatPrice(monthlyPrice)}
            <Text style={{ color: FLX.mistDim, fontSize: 13, fontWeight: 'normal' }}> kr./md</Text>
          </Text>
          <Text style={{ color: FLX.mistDim, fontSize: 11, marginTop: 6, lineHeight: 16 }}>
            {remaining} rater · {formatPrice(splitTotal!)} kr. i alt
          </Text>
        </>
      ) : (
        <>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
            {formatPrice(fullPrice!)}
            <Text style={{ color: FLX.mistDim, fontSize: 13, fontWeight: 'normal' }}> kr.</Text>
          </Text>
          <Text style={{ color: FLX.gold, fontSize: 11, marginTop: 6 }}>Én betaling nu</Text>
          {savings > 0 && (
            <View style={{
              marginTop: 10, alignSelf: 'flex-start',
              backgroundColor: FLX.gold, borderRadius: 6,
              paddingHorizontal: 8, paddingVertical: 3,
            }}>
              <Text style={{ color: FLX.green, fontSize: 10, fontWeight: 'bold' }}>
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

  // Checkout on golfer web, logged in through the handoff (lib/web.ts)
  async function handleSignup() {
    await openGolferWeb('/checkout')
  }

  function handleSignOut() {
    Alert.alert('Log ud', 'Er du sikker på, at du vil logge ud?', [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Log ud', style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: FLX.green }}>
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
            <Text style={{ color: FLX.mistDim, fontSize: 13 }}>Velkommen til TEEFLX</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Hej, {firstName}! 👋</Text>
          </View>
        </View>

        {/* Missing pass banner */}
        <View style={{
          backgroundColor: FLX.card,
          borderRadius: 16,
          padding: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginBottom: 28,
          borderWidth: 1,
          borderColor: FLX.line,
        }}>
          <View style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: FLX.line,
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Ionicons name="lock-closed-outline" size={22} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 2 }}>
              Intet aktivt sæsonkort
            </Text>
            <Text style={{ color: FLX.mistDim, fontSize: 13, lineHeight: 18 }}>
              Du skal købe et sæsonkort for at spille i samarbejdsklubberne.
            </Text>
          </View>
        </View>

        {/* What you get */}
        <Text style={{ color: FLX.mistDim, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
          Hvad du får
        </Text>
        <View style={{ backgroundColor: FLX.card, borderRadius: 16, padding: 18, marginBottom: 28, gap: 14 }}>
          {PERKS.map((perk, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: FLX.goldTint,
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Ionicons name={perk.icon} size={18} color={FLX.gold} />
              </View>
              <Text style={{ color: FLX.mist, fontSize: 14, flex: 1 }}>{perk.label}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        {passes.length > 0 && (
          <>
            <Text style={{ color: FLX.mistDim, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
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
          className="bg-flx-gold rounded-full py-4 flex-row items-center justify-center gap-2 mb-3 active:opacity-75"
        >
          <Text className="text-flx-green font-bold text-base">
            Køb sæsonkort på teeflx.com
          </Text>
          <Ionicons name="open-outline" size={20} color={FLX.green} />
        </Pressable>

        <Text className="text-flx-mist-dim text-xs text-center mb-6">
          Genstart appen efter køb for at aktivere dit kort.
        </Text>

        <Pressable
          onPress={handleSignOut}
          className='flex-row items-center justify-center'
          style={({ pressed }) => ({ alignItems: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ color: FLX.line, fontSize: 13 }}>Log ud</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
