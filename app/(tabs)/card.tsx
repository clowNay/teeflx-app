import { useState } from 'react'
import { View, Text, Pressable, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import QRCode from 'react-native-qrcode-svg'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/context/AuthContext'

export default function CardScreen() {
  const { player } = useAuth()
  const [bright, setBright] = useState(false)

  const pass = player?.playerSeasonPasses?.[0]
  const isActive = pass?.status === 'ACTIVE'

  // QR payload: player unionId (what clubs scan at check-in)
  const qrValue = player?.unionId ?? player?.lifetimeId ?? 'unknown'

  function fmtDate(iso: string | null | undefined) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  return (
    <>
      <StatusBar barStyle={bright ? 'dark-content' : 'light-content'} />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: bright ? '#ffffff' : '#0c0c0c' }}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <View>
              <Text style={{ color: bright ? '#111' : '#9ca3af', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
                Medlemskort
              </Text>
              <Text style={{ color: bright ? '#111' : '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 2 }}>
                TEEFLX
              </Text>
            </View>
            {/* Brightness toggle */}
            <Pressable
              onPress={() => setBright(b => !b)}
              style={{
                backgroundColor: bright ? '#f3f4f6' : '#1a1a1a',
                padding: 10,
                borderRadius: 12,
              }}
            >
              <Ionicons
                name={bright ? 'sunny' : 'sunny-outline'}
                size={20}
                color={bright ? '#f59e0b' : '#9ca3af'}
              />
            </Pressable>
          </View>

          {/* Card */}
          <View style={{
            backgroundColor: bright ? '#fff' : '#111',
            borderRadius: 24,
            padding: 28,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 10,
          }}>
            {/* Status badge */}
            <View style={{
              backgroundColor: isActive ? '#16a34a' : '#374151',
              paddingHorizontal: 14,
              paddingVertical: 5,
              borderRadius: 20,
              marginBottom: 24,
            }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>
                {isActive ? '✓ AKTIV SÆSON ' + (pass?.season?.year ?? '') : 'INAKTIV'}
              </Text>
            </View>

            {/* QR Code */}
            <View style={{
              padding: 16,
              backgroundColor: '#fff',
              borderRadius: 16,
              marginBottom: 24,
            }}>
              <QRCode
                value={qrValue}
                size={200}
                color="#000"
                backgroundColor="#fff"
              />
            </View>

            {/* Player info */}
            <Text style={{
              color: bright ? '#111' : '#fff',
              fontSize: 20,
              fontWeight: 'bold',
              marginBottom: 4,
            }}>
              {player?.name ?? '—'}
            </Text>
            <Text style={{ color: bright ? '#6b7280' : '#9ca3af', fontSize: 14, marginBottom: 2 }}>
              {player?.club?.name ?? '—'}
            </Text>
            <Text style={{ color: bright ? '#9ca3af' : '#6b7280', fontSize: 12, fontFamily: 'monospace' }}>
              {player?.unionId ?? player?.lifetimeId ?? '—'}
            </Text>
          </View>

          {/* Validity footer */}
          {pass && (
            <View style={{
              marginTop: 20,
              backgroundColor: bright ? '#f9fafb' : '#111',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              <View>
                <Text style={{ color: bright ? '#9ca3af' : '#6b7280', fontSize: 11 }}>Gyldig fra</Text>
                <Text style={{ color: bright ? '#111' : '#fff', fontSize: 13, fontWeight: '600' }}>
                  {fmtDate(pass.season?.startDate)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: bright ? '#9ca3af' : '#6b7280', fontSize: 11 }}>Gyldig til</Text>
                <Text style={{ color: bright ? '#111' : '#fff', fontSize: 13, fontWeight: '600' }}>
                  {fmtDate(pass.season?.endDate)}
                </Text>
              </View>
            </View>
          )}

          {/* Hint */}
          <Text style={{
            color: bright ? '#9ca3af' : '#4b5563',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 16,
          }}>
            Tryk på ☀️ for lysere skærm ved scanning
          </Text>
        </View>
      </SafeAreaView>
    </>
  )
}
