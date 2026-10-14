import { useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { Achievement } from '@/lib/types'
import { FLX } from '@/lib/theme'

const ACHIEVEMENT_META: Record<string, { label: string; description: string; icon: string; reward: number }> = {
  CLUB_EXPLORER:      { label: 'Club Explorer',      description: 'Spil på 5 samarbejdsklubber',             icon: '🗺️', reward: 250 },
  SOCIAL_GOLFER:      { label: 'Social Golfer',       description: 'Henvis 3 venner der køber sæsonkort',       icon: '👥', reward: 750 },
  EARLY_BIRD:         { label: 'Early Bird',           description: 'Køb sæsonkort inden 1. marts',              icon: '🌅', reward: 200 },
  GLOBETROTTER:       { label: 'Globetrotter',         description: 'Spil 10 runder på 10 forskellige baner',   icon: '✈️', reward: 200 },
  REFERRED_BY_FRIEND: { label: 'Referred by Friend',  description: 'Bliv henvist af en ven',                    icon: '🤝', reward: 250 },
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const meta = ACHIEVEMENT_META[achievement.slug]
  const isUnlocked = !!achievement.unlockedAt
  const pct = Math.min(100, Math.round((achievement.progress / achievement.goal) * 100))

  return (
    <View style={{
      backgroundColor: FLX.card,
      borderRadius: 16,
      padding: 18,
      marginBottom: 10,
      borderWidth: isUnlocked ? 1 : 0,
      borderColor: isUnlocked ? FLX.goldSoft : 'transparent',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
        {/* Icon */}
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: isUnlocked ? FLX.goldTint : FLX.card,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 24 }}>{meta?.icon ?? '🏆'}</Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
              {meta?.label ?? achievement.slug}
            </Text>
            {isUnlocked ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={16} color={FLX.gold} />
                <Text style={{ color: FLX.gold, fontSize: 12, fontWeight: '600' }}>
                  +{achievement.walletCreditAmount ?? meta?.reward ?? 0} DKK
                </Text>
              </View>
            ) : (
              <Text style={{ color: FLX.mistDim, fontSize: 12 }}>
                +{meta?.reward ?? 0} DKK
              </Text>
            )}
          </View>

          <Text style={{ color: FLX.mistDim, fontSize: 13, marginTop: 2, marginBottom: 10 }}>
            {meta?.description ?? ''}
          </Text>

          {/* Progress bar */}
          {!isUnlocked && (
            <>
              <View style={{ height: 6, backgroundColor: FLX.line, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: '100%', backgroundColor: FLX.gold, borderRadius: 3 }} />
              </View>
              <Text style={{ color: FLX.mistDim, fontSize: 11, marginTop: 5 }}>
                {achievement.progress} / {achievement.goal}
              </Text>
            </>
          )}

          {isUnlocked && achievement.unlockedAt && (
            <Text style={{ color: FLX.line, fontSize: 11 }}>
              Låst op {new Date(achievement.unlockedAt).toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default function AchievementsScreen() {
  const { player } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    if (!player?.id) return
    try {
      const data = await api.get<{ achievements: Achievement[] }>(`/v2/achievements/players/${player.id}`)
      setAchievements(data.achievements ?? [])
    } catch {}
    finally { setLoading(false) }
  }

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  useEffect(() => { load() }, [player?.id])

  const unlocked = achievements.filter(a => a.unlockedAt)
  const inProgress = achievements.filter(a => !a.unlockedAt)
  const totalEarned = unlocked.reduce((s, a) => s + (a.walletCreditAmount ?? 0), 0)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: FLX.green }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FLX.gold} />}
      >
        {/* Header */}
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>Præstationer</Text>
        <Text style={{ color: FLX.mistDim, fontSize: 14, marginBottom: 24 }}>
          Tjen wallet-kredit ved at nå dine mål
        </Text>

        {/* Summary strip */}
        {!loading && (
          <View style={{
            backgroundColor: FLX.card,
            borderRadius: 16,
            padding: 18,
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: 24,
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: FLX.gold, fontSize: 28, fontWeight: 'bold' }}>{unlocked.length}</Text>
              <Text style={{ color: FLX.mistDim, fontSize: 12 }}>Låst op</Text>
            </View>
            <View style={{ width: 1, backgroundColor: FLX.line }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{achievements.length}</Text>
              <Text style={{ color: FLX.mistDim, fontSize: 12 }}>I alt</Text>
            </View>
            <View style={{ width: 1, backgroundColor: FLX.line }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: FLX.gold, fontSize: 28, fontWeight: 'bold' }}>{totalEarned}</Text>
              <Text style={{ color: FLX.mistDim, fontSize: 12 }}>DKK tjent</Text>
            </View>
          </View>
        )}

        {/* Unlocked */}
        {unlocked.length > 0 && (
          <>
            <Text style={{ color: FLX.mistDim, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
              Låst op
            </Text>
            {unlocked.map(a => <AchievementCard key={a.slug} achievement={a} />)}
            <View style={{ height: 16 }} />
          </>
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <>
            <Text style={{ color: FLX.mistDim, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
              I gang
            </Text>
            {inProgress.map(a => <AchievementCard key={a.slug} achievement={a} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
