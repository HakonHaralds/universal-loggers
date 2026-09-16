import type { GameState } from './types'
import { EARTH_NEED } from './state'

export interface Region {
  id: string
  name: string
  share: number // fraction of the world's shipments
  difficulty: number // multiplier on how many cards it takes to cover
  unlock?: string // project id that must be bought first
  flavor: string
}

// Shares roughly sum to 1. The gated lanes are the hard, lucrative ones —
// the game's Phase 2 progression is unlocking and filling them in turn.
export const REGIONS: Region[] = [
  { id: 'lastmile', name: 'Last-Mile Delivery', share: 0.14, difficulty: 0.8, flavor: 'Vans, porches, dry ice. The unglamorous majority.' },
  { id: 'pharma_eu', name: 'Pharma EU', share: 0.16, difficulty: 1.0, flavor: 'Where it all started. Roche sends its regards, and a change request.' },
  { id: 'vaccine', name: 'Vaccine Cold Chain', share: 0.18, difficulty: 1.1, flavor: '2–8 °C, no exceptions, ever. The auditors live here.' },
  { id: 'air', name: 'Air Freight', share: 0.16, difficulty: 1.2, unlock: 'r_air', flavor: 'Belly cargo at 38,000 ft. Needs a modem that works over an ocean.' },
  { id: 'marine', name: 'Marine Freight', share: 0.2, difficulty: 1.4, unlock: 'r_marine', flavor: 'Weeks at sea, no signal. Store-and-forward or nothing.' },
  { id: 'ultracold', name: 'Ultra-cold −70 °C', share: 0.16, difficulty: 1.6, unlock: 'r_ultra', flavor: 'mRNA and the −30 °C clinical asks. The card must survive what it measures.' },
]

export const regionReq = (r: Region): number => r.share * EARTH_NEED * r.difficulty
export const TOTAL_REQ = REGIONS.reduce((sum, r) => sum + regionReq(r), 0)

export const regionUnlocked = (s: GameState, r: Region): boolean => !r.unlock || s.purchased.includes(r.unlock)
export const regionFillOf = (s: GameState, id: string): number => s.regionFill[id] ?? 0
export const regionFull = (s: GameState, r: Region): boolean => regionFillOf(s, r.id) >= regionReq(r) - 1

export function coverageFromRegions(s: GameState): number {
  let covered = 0
  for (const r of REGIONS) covered += Math.min(regionFillOf(s, r.id), regionReq(r))
  return Math.min(1, covered / TOTAL_REQ)
}

// Pick the next lane to pour production into: the focused one if it still has
// room, otherwise the first unlocked, unfilled lane.
export function resolveFocus(s: GameState): string | null {
  const cur = s.focus ? REGIONS.find((r) => r.id === s.focus) : null
  if (cur && regionUnlocked(s, cur) && !regionFull(s, cur)) return cur.id
  const next = REGIONS.find((r) => regionUnlocked(s, r) && !regionFull(s, r))
  return next ? next.id : null
}
