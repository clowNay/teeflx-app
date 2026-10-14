import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, RefreshControl, Share, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { WalletTransaction, ReferralStats } from '@/lib/types'
import { FLX } from '@/lib/theme'

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ color: FLX.mistDim, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, marginTop: 24 }}>
      {title}
    </Text>
  )
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const amount = parseFloat(tx.amount)
  const isCredit = amount > 0
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: FLX.line }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: '#fff', fontSize: 14 }}>{tx.description ?? tx.type}</Text>
        <Text style={{ color: FLX.mistDim, fontSize: 12, marginTop: 1 }}>
          {new Date(tx.createdAt).toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <Text style={{ color: isCredit ? FLX.gold : '#ef4444', fontWeight: 'bold', fontSize: 15 }}>
        {isCredit ? '+' : ''}{amount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency}
      </Text>
    </View>
  )
}

export default function AccountScreen() {
  const { player, signOut, refresh } = useAuth()
  const router = useRouter()

  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [referral, setReferral] = useState<ReferralStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

  async function load() {
    if (!player?.id) return
    try {
      const [txData, refData] = await Promise.all([
        api.get<{ transactions: WalletTransaction[] }>(`/v2/players/${player.id}/wallet/transactions`),
        api.get<ReferralStats>(`/v2/referrals/player/${player.id}`),
      ])
      setTransactions(txData.transactions ?? [])
      setReferral(refData)
    } catch {}
  }

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([refresh(), load()])
    setRefreshing(false)
  }

  useEffect(() => { load() }, [player?.id])

  async function copyCode() {
    const code = referral?.code ?? player?.referralCode
    if (!code) return
    await Clipboard.setStringAsync(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareCode() {
    const code = referral?.code ?? player?.referralCode
    if (!code) return
    await Share.share({
      message: `Brug min TEEFLX referral kode ${code} ved tilmelding og vi får begge 250 kr. i wallet-kredit! 🏌️\nhttps://www.teeflx.com`,
    })
  }

  async function handleSignOut() {
    Alert.alert('Log ud', 'Er du sikker på, at du vil logge ud?', [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Log ud', style: 'destructive', onPress: signOut },
    ])
  }

  const walletAmount = player?.walletBalance ? parseFloat(player.walletBalance.value) : 0
  const referralCode = referral?.code ?? player?.referralCode ?? '—'
  const initial = player?.name?.trim()[0]?.toUpperCase() ?? '?'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: FLX.green }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FLX.gold} />}
      >
        {/* Profile header */}
        <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 24 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: FLX.gold,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Text style={{ color: FLX.green, fontSize: 28, fontWeight: 'bold' }}>{initial}</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{player?.name ?? '—'}</Text>
          <Text style={{ color: FLX.mistDim, fontSize: 14, marginTop: 2 }}>{player?.club?.name ?? '—'}</Text>
          <Text style={{ color: FLX.mistDim, fontSize: 12, marginTop: 1, fontFamily: 'monospace' }}>
            {player?.unionId ?? player?.lifetimeId ?? '—'}
          </Text>
        </View>

        {/* Wallet */}
        <SectionHeader title="Wallet" />
        <View style={{ backgroundColor: FLX.card, borderRadius: 16, padding: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ color: FLX.mistDim, fontSize: 12 }}>Balance</Text>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
                {walletAmount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <Text style={{ color: FLX.mistDim, fontSize: 16 }}> DKK</Text>
              </Text>
            </View>
            <Ionicons name="wallet" size={32} color={FLX.gold} />
          </View>

          {transactions.length > 0 ? (
            <>
              <Text style={{ color: FLX.mistDim, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                Seneste transaktioner
              </Text>
              {transactions.slice(0, 5).map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </>
          ) : (
            <Text style={{ color: FLX.mistDim, fontSize: 13, fontStyle: 'italic' }}>Ingen transaktioner endnu.</Text>
          )}
        </View>

        {/* Referral */}
        <SectionHeader title="Referral" />
        <View style={{ backgroundColor: FLX.card, borderRadius: 16, padding: 18 }}>
          {/* Stats */}
          {referral && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>{referral.invitedCount}</Text>
                <Text style={{ color: FLX.mistDim, fontSize: 12 }}>Inviteret</Text>
              </View>
              <View style={{ width: 1, backgroundColor: FLX.line }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>{referral.paidCount}</Text>
                <Text style={{ color: FLX.mistDim, fontSize: 12 }}>Betalt</Text>
              </View>
              <View style={{ width: 1, backgroundColor: FLX.line }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: FLX.gold, fontSize: 22, fontWeight: 'bold' }}>{referral.totalEarned}</Text>
                <Text style={{ color: FLX.mistDim, fontSize: 12 }}>DKK tjent</Text>
              </View>
            </View>
          )}

          {/* Code */}
          <Text style={{ color: FLX.mistDim, fontSize: 12, marginBottom: 8 }}>Din referral kode</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{
              flex: 1, backgroundColor: FLX.card, borderRadius: 12, padding: 14,
              borderWidth: 1, borderColor: FLX.line,
            }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 2, fontFamily: 'monospace' }}>
                {referralCode}
              </Text>
            </View>
            <Pressable
              onPress={copyCode}
              style={({ pressed }) => ({
                backgroundColor: copied ? FLX.goldTint : FLX.card,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: copied ? FLX.goldSoft : FLX.line,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={copied ? FLX.gold : FLX.mistDim} />
            </Pressable>
            <Pressable
              onPress={shareCode}
              style={({ pressed }) => ({
                backgroundColor: FLX.gold,
                borderRadius: 12,
                padding: 14,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="share-outline" size={20} color={FLX.green} />
            </Pressable>
          </View>
          <Text style={{ color: FLX.mistDim, fontSize: 12, marginTop: 10 }}>
            Du og din ven får begge 250 kr. i wallet-kredit når de køber sæsonkort
          </Text>
        </View>

        {/* Sign out */}
        <SectionHeader title="Indstillinger" />
        <Pressable
          onPress={handleSignOut}
          style={{ backgroundColor: FLX.card, borderRadius: 16, padding: 18 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600' }}>Log ud</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
