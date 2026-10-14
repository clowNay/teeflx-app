import type { PlayerSeasonPass } from '@/lib/types'

const ENDED_STATUSES = ['CANCELED', 'EXPIRED', 'COMPLETED']

/**
 * The card the app shows: the one whose season is being played now, otherwise
 * the next one (a pre-registration for next season). A golfer can hold both in
 * October, when next season is already on sale.
 */
export function currentPass(passes: PlayerSeasonPass[] | null | undefined, now = new Date()): PlayerSeasonPass | null {
  const live = (passes ?? []).filter(p => !ENDED_STATUSES.includes(p.status) && p.seasonPass?.season)
  const starts = (p: PlayerSeasonPass) => new Date(p.seasonPass.season!.playStartsAt).getTime()
  const ends = (p: PlayerSeasonPass) => new Date(p.seasonPass.season!.playEndsAt).getTime()

  const playing = live.find(p => starts(p) <= now.getTime() && now.getTime() <= ends(p))
  if (playing) return playing

  return live
    .filter(p => starts(p) > now.getTime())
    .sort((a, b) => starts(a) - starts(b))[0] ?? null
}

/** The card's name: FLX-Lite, FLX-Plus, FLX-Unlimited or "Sæsonkort 2026" */
export function cardName(pass: PlayerSeasonPass): string {
  return pass.seasonPass.title ?? pass.seasonPass.name
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktiv',
  UPCOMING: 'Kommende',
  PENDING: 'Afventer betaling',
  SUSPENDED: 'På pause',
}

export function statusLabel(status: string | undefined): string {
  return (status && STATUS_LABELS[status]) ?? 'Intet kort'
}

/** "1. april 2027" */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Copenhagen' })
}

export function formatRounds(rounds: number): string {
  return rounds === 1 ? '1 runde' : `${rounds} runder`
}
