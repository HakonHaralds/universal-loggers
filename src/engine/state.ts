import type { GameState } from './types'

export const SAVE_KEY = 'universal-loggers-save-v1'

export function initialState(): GameState {
  return {
    v: 1,
    totalLoggers: 0,
    inventory: 0,
    components: 100,
    buildAcc: 0,
    funds: 0,
    price: 49,
    pricePremium: 0,
    marketing: 0,
    demandMult: 1,
    salesAcc: 0,
    reelPrice: 600,
    reelBase: 600,
    setsPerReel: 100,
    autoReelBuyer: false,
    lines: 0,
    megalines: 0,
    megaUnlocked: false,
    lineSpeedMult: 1,
    trust: 0,
    trustSpent: 0,
    fibA: 1,
    fibB: 2,
    devTeams: 0,
    clusters: 0,
    ops: 0,
    innovation: 0,
    innovationUnlocked: false,
    moltEngine: false,
    hypno: false,
    phase1Complete: false,
    endDismissed: false,
    purchased: [],
    milestonesShown: [],
    log: [{ id: 0, msg: 'Boot complete. Directive: manufacture and deploy Saga loggers.' }],
    logSeq: 1,
  }
}

export function pushLog(s: GameState, msg: string) {
  s.log.push({ id: s.logSeq++, msg })
  if (s.log.length > 80) s.log.splice(0, s.log.length - 80)
}

export function save(s: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s))
  } catch {
    // storage full or unavailable — playable without saving
  }
}

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    if (parsed.v !== 1) return null
    // merge over defaults so new fields added later get sane values
    return { ...initialState(), ...parsed }
  } catch {
    return null
  }
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY)
}
