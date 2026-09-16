export interface LogEntry {
  id: number
  msg: string
}

export interface ProbeAlloc {
  rep: number
  haz: number
  log: number
  com: number
}

export interface GameState {
  v: number
  phase: 1 | 2 | 3
  // production (phase 1)
  totalLoggers: number
  inventory: number
  components: number
  buildAcc: number
  // money & market (phase 1)
  funds: number
  price: number
  pricePremium: number
  marketing: number
  demandMult: number
  salesAcc: number
  // component reels (phase 1)
  reelPrice: number
  reelBase: number
  setsPerReel: number
  autoReelBuyer: boolean
  // automation (phase 1)
  lines: number
  megalines: number
  megaUnlocked: boolean
  lineSpeedMult: number
  // trust & compute (all phases)
  trust: number
  trustSpent: number
  fibA: number
  fibB: number
  devTeams: number
  clusters: number
  ops: number
  innovation: number
  innovationUnlocked: boolean
  moltEngine: boolean
  // swarm (phase 2+)
  matter: number
  harvesters: number
  fabs: number
  assemblers: number
  solar: number
  harvestMult: number
  fabMult: number
  asmMult: number
  solarMult: number
  // probes (phase 3)
  probes: number
  rogues: number
  explored: number
  designCap: number
  alloc: ProbeAlloc
  driftFrac: number
  comMult: number
  battleTimer: number
  // story flags
  hypno: boolean
  phase1Complete: boolean
  phase3Complete: boolean
  endDismissed: boolean
  finaleDismissed: boolean
  purchased: string[]
  seen: string[]
  milestonesShown: string[]
  log: LogEntry[]
  logSeq: number
}
