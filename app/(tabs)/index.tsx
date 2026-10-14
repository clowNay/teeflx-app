import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { Achievement, RoundLedger } from '@/lib/types'
import { currentPass, cardName, statusLabel, formatDay, formatRounds } from '@/lib/cards'

const ACHIEVEMENT_LABELS: Record<string, string> = {
  CLUB_EXPLORER:      'Club Explorer',
  SOCIAL_GOLFER:      'Social Golfer',
  EARLY_BIRD:         'Early Bird',
  GLOBETROTTER:       'Globetrotter',
  REFERRED_BY_FRIEND: 'Referred by Friend',
}

export default function HomeScreen() {
  const { player, refresh: refreshAuth } = useAuth()
  const router = useRouter()

  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [ledger, setLedger] = useState<RoundLedger | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function loadAchievements() {
    if (!player?.id) return
    try {
      const data = await api.get<{ achievements: Achievement[] }>(`/v2/achievements/players/${player.id}`)
      setAchievements(data.achievements ?? [])
    } catch {}
  }

  // Rounds on the card for the season on sale: allowance, played, booked, left
  async function loadLedger() {
    if (!player?.lifetimeId) return
    try {
      setLedger(await api.get<RoundLedger | null>(`/v2/players/account/${player.lifetimeId}/round-ledger`))
    } catch {
      setLedger(null)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([refreshAuth(), loadAchievements(), loadLedger()])
    setRefreshing(false)
  }

  useEffect(() => { loadAchievements() }, [player?.id])
  useEffect(() => { loadLedger() }, [player?.lifetimeId])

  const pass = currentPass(player?.playerSeasonPasses)
  const isActive = pass?.status === 'ACTIVE'
  // The ledger belongs to the card for the season on sale, which may not be the card shown
  const passLedger = ledger && pass && ledger.cardId === pass.id ? ledger : null
  const unlimited = pass ? (passLedger ? passLedger.unlimited : pass.roundsIncluded === null) : false
  const notStarted = !!pass?.seasonPass.season && new Date(pass.seasonPass.season.playStartsAt) > new Date()
  const firstName = player?.name?.split(' ')[0] ?? 'Golfer'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'God morgen' : hour < 18 ? 'Goddag' : 'God aften'
  const walletAmount = player?.walletBalance ? parseFloat(player.walletBalance.value) : 0
  const unlocked = achievements.filter(a => a.unlockedAt)
  const nextUp = achievements.find(a => !a.unlockedAt)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0c0c0c' }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
      >
        {/* Greeting */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#9ca3af', fontSize: 14 }}>{greeting}</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{firstName} 👋</Text>
        </View>

        {/* Season pass card */}
        <View style={{
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 12,
          backgroundColor: isActive ? '#14532d' : '#1a1a1a',
          padding: 20,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <View>
              <Text style={{ color: '#9ca3af', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Sæsonkort</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>
                {pass ? cardName(pass) : 'Intet sæsonkort'}
              </Text>
            </View>
            <View style={{
              backgroundColor: isActive ? '#16a34a' : '#374151',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
            }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>
                {statusLabel(pass?.status).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: '#9ca3af', fontSize: 11 }}>Spiller</Text>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{player?.name ?? '—'}</Text>
            </View>
            {pass?.seasonPass.season && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#9ca3af', fontSize: 11 }}>Sæson</Text>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{pass.seasonPass.season.year}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Rounds on the card */}
        {pass && (
          <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: '#9ca3af', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Runder</Text>
              <Ionicons name="golf-outline" size={18} color="#16a34a" />
            </View>
            {unlimited ? (
              <>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Ubegrænset spil</Text>
                <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                  {notStarted ? `Fra ${formatDay(pass.seasonPass.season?.playStartsAt)}` : 'Book i GolfBox på alle vores samarbejdsklubber'}
                </Text>
              </>
            ) : passLedger && passLedger.allowance !== null ? (
              <>
                <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                  {passLedger.remaining ?? 0}
                  <Text style={{ color: '#9ca3af', fontSize: 18 }}> af {passLedger.allowance} tilbage</Text>
                </Text>
                {/* Played rounds, then booked ones in a lighter green */}
                <View style={{ height: 6, borderRadius: 3, backgroundColor: '#374151', marginTop: 12, overflow: 'hidden', flexDirection: 'row' }}>
                  <View style={{ height: 6, backgroundColor: passLedger.exhausted ? '#f59e0b' : '#16a34a', width: `${Math.min(100, (passLedger.played / Math.max(1, passLedger.allowance)) * 100)}%` }} />
                  <View style={{ height: 6, backgroundColor: '#166534', width: `${Math.max(0, Math.min(100 - (passLedger.played / Math.max(1, passLedger.allowance)) * 100, (passLedger.upcoming / Math.max(1, passLedger.allowance)) * 100))}%` }} />
                </View>
                <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>
                  {notStarted
                    ? `Dine runder kan bruges fra ${formatDay(pass.seasonPass.season?.playStartsAt)}`
                    : `${formatRounds(passLedger.played)} spillet · ${formatRounds(passLedger.upcoming)} booket`}
                </Text>
                {passLedger.overBooked > 0 && (
                  <Text style={{ color: '#f59e0b', fontSize: 12, marginTop: 8 }}>
                    Du har booket {formatRounds(passLedger.overBooked)} mere, end du har tilbage. De koster almindelig greenfee.
                  </Text>
                )}
                {passLedger.exhausted && passLedger.overBooked === 0 && (
                  <Text style={{ color: '#f59e0b', fontSize: 12, marginTop: 8 }}>
                    Dine runder er brugt. Næste runde koster almindelig greenfee, medmindre du køber en ekstra runde eller opgraderer.
                  </Text>
                )}
              </>
            ) : (
              <Text style={{ color: '#6b7280', fontSize: 13 }}>Runderne vises, når dit kort er betalt.</Text>
            )}
          </View>
        )}

        {/* Show card CTA */}
        <View style={{ marginBottom: 12 }}>
          <Pressable
            onPress={() => router.push('/(tabs)/card')}
            style={{ backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="qr-code-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Vis medlemskort</Text>
            </View>
          </Pressable>
        </View>

        {/* Wallet */}
        <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: '#9ca3af', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Wallet</Text>
            <Ionicons name="wallet-outline" size={18} color="#16a34a" />
          </View>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
            {walletAmount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <Text style={{ color: '#9ca3af', fontSize: 18 }}> DKK</Text>
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
            Bruges som rabat ved næste sæsonkort
          </Text>
        </View>

        {/* Achievement strip */}
        {achievements.length > 0 && (
          <Pressable
            onPress={() => router.push('/(tabs)/achievements')}
            style={{ backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 12 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Præstationer</Text>
              <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>
                {unlocked.length}/{achievements.length} låst op
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {achievements.map(a => (
                <View
                  key={a.slug}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: a.unlockedAt ? '#16a34a' : '#374151',
                  }}
                />
              ))}
            </View>
            {nextUp && (
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 10 }}>
                Næste: {ACHIEVEMENT_LABELS[nextUp.slug] ?? nextUp.slug} · {nextUp.progress}/{nextUp.goal}
              </Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
