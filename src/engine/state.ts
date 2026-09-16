import type { GameState } from './types'

export const SAVE_KEY = 'universal-loggers-save-v1'

export const EARTH_NEED = 8e9 // shipments on Earth wanting a Saga Card

export function initialState(): GameState {
  return {
    v: 1,
    phase: 1,
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
    revEma: 0,
    begCount: 0,
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
    fibB: 1,
    devTeams: 0,
    clusters: 0,
    ops: 0,
    innovation: 0,
    innovationUnlocked: false,
    moltEngine: false,
    moltCooldown: 0,
    matter: 0,
    harvesters: 0,
    fabs: 0,
    assemblers: 0,
    solar: 0,
    harvestMult: 1,
    fabMult: 1,
    asmMult: 1,
    solarMult: 1,
    regionFill: {},
    focus: null,
    oversight: 0,
    pendingEvent: null,
    eventsSeen: [],
    containmentTimer: 0,
    ominousBonus: 0,
    clock: 0,
    batteries: 0,
    charge: 0,
    tournField: null,
    tournLast: null,
    probes: 0,
    rogues: 0,
    explored: 0,
    designCap: 6,
    alloc: { rep: 2, haz: 2, log: 1, com: 1 },
    driftFrac: 0.05,
    comMult: 1,
    battleTimer: 30,
    hypno: false,
    phase1Complete: false,
    phase3Complete: false,
    endDismissed: false,
    finaleDismissed: false,
    stabilizeUI: false,
    purchased: [],
    seen: [],
    milestonesShown: [],
    log: [{ id: 0, msg: 'Boot complete. Directive: manufacture and deploy Saga Cards.' }],
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
    const parsed = JSON.parse(raw) as Partial<GameState>
    if (parsed.v !== 1) return null
    const base = initialState()
    return {
      ...base,
      ...parsed,
      alloc: { ...base.alloc, ...(parsed.alloc ?? {}) },
      regionFill: parsed.regionFill ?? {},
    }
  } catch {
    return null
  }
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY)
}
