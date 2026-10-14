import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TextInput, Pressable, RefreshControl, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { FLX } from '@/lib/theme'

interface ClubListing {
  id: string
  logoUrl: string | null
  logoInvert: boolean
  coverImageUrl: string | null
  shortDescription: string | null
  region: string | null
  isNew: boolean
  club: {
    id: string
    name: string
    originalId: string
    logoUrl: string | null
  }
}


export default function ClubsScreen() {
  const [listings, setListings] = useState<ClubListing[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const data = await api.get<ClubListing[]>('/v2/club-listings/published')
      setListings(data)
    } catch (err) {
      console.error('[Clubs] load failed:', err)
    } finally {
      setLoading(false)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  const filtered = listings.filter(l =>
    !search || l.club.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: FLX.green }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>Samarbejdsklubber</Text>
        <Text style={{ color: FLX.mistDim, fontSize: 14, marginBottom: 16 }}>
          Spil på alle disse samarbejdsklubber med dit TEEFLX-kort
        </Text>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: FLX.card, borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 10,
          gap: 10,
        }}>
          <Ionicons name="search-outline" size={18} color={FLX.mistDim} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Søg efter samarbejdsklub..."
            placeholderTextColor={FLX.mistDim}
            style={{ flex: 1, color: '#fff', fontSize: 15 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={FLX.mistDim} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FLX.gold} />}
      >
        {loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <Text style={{ color: FLX.mistDim }}>Henter samarbejdsklubber…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <Text style={{ color: FLX.mistDim, fontSize: 16 }}>Ingen samarbejdsklubber fundet</Text>
          </View>
        ) : (
          filtered.map(listing => (
            <View
              key={listing.id}
              style={{
                backgroundColor: FLX.card,
                borderRadius: 16,
                marginBottom: 8,
                overflow: 'hidden',
                borderWidth: listing.isNew ? 1.5 : 0,
                borderColor: FLX.gold,
              }}
            >
              {/* New club banner */}
              {listing.isNew && (
                <View style={{
                  backgroundColor: FLX.gold,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Text style={{ fontSize: 12 }}>✨</Text>
                  <Text style={{ color: FLX.green, fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 }}>
                    NY SAMARBEJDSKLUB
                  </Text>
                </View>
              )}

              {/* Cover image */}
              {listing.coverImageUrl && (
                <Image
                  source={{ uri: listing.coverImageUrl }}
                  style={{ width: '100%', height: 110, backgroundColor: FLX.card }}
                  resizeMode="cover"
                />
              )}

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 14 }}>
                {/* Logo — listing logo takes priority, falls back to club logo, hidden if neither */}
                {(listing.logoUrl ?? listing.club.logoUrl) ? (
                  <View style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: FLX.card,
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    <Image
                      source={{ uri: (listing.logoUrl ?? listing.club.logoUrl)! }}
                      style={{ width: 44, height: 44 }}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}

                {/* Info — grows freely, no height constraint */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 4 }} numberOfLines={1}>
                    {listing.club.name}
                  </Text>
                  {listing.shortDescription ? (
                    <Text style={{ color: FLX.mistDim, fontSize: 13, lineHeight: 18 }}>
                      {listing.shortDescription}
                    </Text>
                  ) : listing.region ? (
                    <Text style={{ color: FLX.mistDim, fontSize: 13 }}>{listing.region}</Text>
                  ) : null}
                </View>

              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
