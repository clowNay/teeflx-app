export interface Player {
  id: string
  name: string | null
  email: string | null
  lifetimeId: string | null
  unionId: string | null
  birthyear: number | null
  status: string
  referralCode: string | null
  dguAccessToken: string | null
  club: Club | null
  playerSeasonPasses: PlayerSeasonPass[]
  walletBalance?: { value: string; currency: string } | null
}

export interface Club {
  id: string
  name: string
  originalId: string
  golfboxId: string | null
}

export interface PlayerSeasonPass {
  id: string
  status: string
  season: Season
  plan: Plan
  paidAt: string | null
  expiresAt: string | null
}

export interface Season {
  id: string
  year: number
  startDate: string
  endDate: string
}

export interface Plan {
  id: string
  name: string
  price: number
}

export interface Achievement {
  slug: string
  unlockedAt: string | null
  progress: number
  goal: number
  walletCreditAmount: number | null
}

export interface WalletTransaction {
  id: string
  type: string
  amount: string
  currency: string
  description: string | null
  createdAt: string
}

export interface ReferralStats {
  code: string
  invitedCount: number
  paidCount: number
  totalEarned: number
  referrals: ReferralEntry[]
}

export interface ReferralEntry {
  id: string
  refereeName: string | null
  status: string
  creditAmount: number | null
  createdAt: string
}
