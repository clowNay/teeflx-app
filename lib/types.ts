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

// A golfer's card, as /oauth/me returns it (the season sits on the season pass)
export interface PlayerSeasonPass {
  id: string
  status: string
  // Rounds for this card (null = unlimited)
  roundsIncluded: number | null
  seasonPass: SeasonPass
}

export interface SeasonPass {
  id: string
  name: string
  title: string | null
  // Rounds for a full season (null = unlimited)
  roundsIncluded: number | null
  season: Season | null
}

export interface Season {
  id: string
  year: number
  playStartsAt: string
  playEndsAt: string
}

// GET /v2/players/account/:lifetimeId/round-ledger: the rounds on the card for the season on sale
export interface RoundLedger {
  seasonYear: number
  cardId: string
  // Rounds the card allows (included + extra), null = unlimited
  allowance: number | null
  played: number
  upcoming: number
  remaining: number | null
  // Upcoming bookings beyond what is left; GolfBox charges normal greenfee for these
  overBooked: number
  exhausted: boolean
  unlimited: boolean
  extraRoundPrice: { value: string; currency: string } | null
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
