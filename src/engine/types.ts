export interface LogEntry {
  id: number
  msg: string
}

export interface GameState {
  v: number
  // production
  totalLoggers: number
  inventory: number
  components: number
  buildAcc: number
  // money & market
  funds: number
  price: number
  pricePremium: number
  marketing: number
  demandMult: number
  salesAcc: number
  // component reels
  reelPrice: number
  reelBase: number
  setsPerReel: number
  autoReelBuyer: boolean
  // automation
  lines: number
  megalines: number
  megaUnlocked: boolean
  lineSpeedMult: number
  // trust & compute
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
  // story flags
  hypno: boolean
  phase1Complete: boolean
  endDismissed: boolean
  purchased: string[]
  milestonesShown: string[]
  log: LogEntry[]
  logSeq: number
}
