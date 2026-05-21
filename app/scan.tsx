import { api } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface ScanResult {
  player: {
    name: string | null
    unionId: string | null
    club: { name: string } | null
  }
  pass: {
    status: string
    season: { year: number } | null
  } | null
  valid: boolean
}

export default function ScanScreen() {
  const router = useRouter()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanning, setScanning] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleScan({ data }: { data: string }) {
    if (!scanning || loading) return
    setScanning(false)
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ScanResult>(`/v2/player-season-passes/scan/${encodeURIComponent(data)}`)
      setResult(res)
    } catch {
      setError('Ukendt member ID. Prøv igen.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResult(null)
    setError(null)
    setScanning(true)
  }

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0c0c0c', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0c0c0c', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Ionicons name="camera-outline" size={64} color="#6b7280" style={{ marginBottom: 20 }} />
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
          Kamera-adgang kræves
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
          For at scanne TEEFLX membership cards skal vi bruge adgang til kameraet.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => ({
            backgroundColor: '#16a34a', paddingHorizontal: 28, paddingVertical: 14,
            borderRadius: 14, opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Giv adgang til kamera</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>Gå tilbage</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Camera — always mounted so re-scan is instant */}
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanning ? handleScan : undefined}
        />

        {/* Overlay */}
        <View style={{ position: 'absolute', inset: 0 }}>
          <SafeAreaView style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }}>
              <Pressable
                onPress={() => router.back()}
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 12 }}
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </Pressable>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }}>SCAN KORT</Text>
              <View style={{ width: 42 }} />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
              Hold kameraet mod QR-koden på medlemskortet
            </Text>
          </SafeAreaView>

          {/* Result bottom sheet */}
          {(loading || result || error) && (
            <View style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              backgroundColor: 'rgba(0,0,0,0.92)',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 28,
              paddingBottom: 48,
            }}>
              {loading && (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator color="#16a34a" size="large" />
                  <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 15 }}>Henter medlems info…</Text>
                </View>
              )}

              {error && (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <View style={{
                    width: 64, height: 64, borderRadius: 32,
                    backgroundColor: '#7f1d1d', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <Ionicons name="close" size={36} color="#ef4444" />
                  </View>
                  <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>Ugyldigt kort</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>{error}</Text>
                  <Pressable onPress={reset} style={({ pressed }) => ({
                    backgroundColor: '#1a1a1a', borderRadius: 14,
                    paddingHorizontal: 28, paddingVertical: 14, opacity: pressed ? 0.7 : 1,
                  })}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Scan igen</Text>
                  </Pressable>
                </View>
              )}

              {result && (
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 72, height: 72, borderRadius: 36,
                    backgroundColor: result.valid ? '#14532d' : '#7f1d1d',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                  }}>
                    <Ionicons
                      name={result.valid ? 'checkmark' : 'close'}
                      size={40}
                      color={result.valid ? '#16a34a' : '#ef4444'}
                    />
                  </View>
                  <Text style={{
                    color: result.valid ? '#16a34a' : '#ef4444',
                    fontSize: 22, fontWeight: 'bold', marginBottom: 4,
                  }}>
                    {result.valid ? 'GYLDIGT KORT' : 'UGYLDIGT KORT'}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 19, fontWeight: 'bold', marginTop: 12 }}>
                    {result.player.name ?? '—'}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 2 }}>
                    {result.player.club?.name ?? '—'}
                  </Text>
                  {result.pass?.season && (
                    <View style={{
                      backgroundColor: result.valid ? '#16a34a' : '#374151',
                      paddingHorizontal: 14, paddingVertical: 5,
                      borderRadius: 20, marginTop: 12,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                        Sæson {result.pass.season.year}
                      </Text>
                    </View>
                  )}
                  <View style={{ marginTop: 24 }}>
                    <Pressable onPress={reset} style={{ backgroundColor: '#1a1a1a', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="qr-code-outline" size={18} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Scan næste</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </>
  )
}
