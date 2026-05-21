import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { Achievement } from '@/lib/types'

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
  const [refreshing, setRefreshing] = useState(false)

  async function loadAchievements() {
    if (!player?.id) return
    try {
      const data = await api.get<{ achievements: Achievement[] }>(`/v2/achievements/players/${player.id}`)
      setAchievements(data.achievements ?? [])
    } catch {}
  }

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([refreshAuth(), loadAchievements()])
    setRefreshing(false)
  }

  useEffect(() => { loadAchievements() }, [player?.id])

  const pass = player?.playerSeasonPasses?.[0]
  const isActive = pass?.status === 'ACTIVE'
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
                {player?.club?.name ?? '—'}
              </Text>
            </View>
            <View style={{
              backgroundColor: isActive ? '#16a34a' : '#374151',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
            }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>
                {isActive ? 'AKTIV' : pass ? pass.status : 'AFVENTER'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: '#9ca3af', fontSize: 11 }}>Spiller</Text>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{player?.name ?? '—'}</Text>
            </View>
            {pass?.season && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#9ca3af', fontSize: 11 }}>Sæson</Text>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{pass.season.year}</Text>
              </View>
            )}
          </View>
        </View>

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
