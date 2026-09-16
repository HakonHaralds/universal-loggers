import type { GameState } from './types'
import { pushLog } from './state'

export function demandPerSec(s: GameState): number {
  return (
    0.9 *
    Math.pow(1.15, s.marketing) *
    Math.pow(45 / Math.max(s.price, 1), 1.5) *
    s.demandMult *
    (s.hypno ? 4 : 1)
  )
}

export function productionPerSec(s: GameState): number {
  return (s.lines + s.megalines * 10) * s.lineSpeedMult
}

export function opsCap(s: GameState): number {
  return s.clusters * 1000
}

interface Milestone {
  id: string
  when: (s: GameState) => boolean
  msg: string
}

const MILESTONES: Milestone[] = [
  { id: 'm500', when: (s) => s.totalLoggers >= 500, msg: 'First pallet of Saga loggers leaves the dock.' },
  { id: 'm10k', when: (s) => s.totalLoggers >= 10_000, msg: 'A top-5 pharma signs a master agreement.' },
  { id: 'm50k', when: (s) => s.totalLoggers >= 50_000, msg: "Competitors pivot to 'AI-powered' dataloggers. It does not help them." },
  { id: 'm250k', when: (s) => s.totalLoggers >= 250_000, msg: 'Every vaccine lane in Europe ships with a Saga aboard.' },
  { id: 'm1m', when: (s) => s.totalLoggers >= 1_000_000, msg: 'One million loggers. The board stops asking questions.' },
  { id: 'f100k', when: (s) => s.funds >= 100_000, msg: "CFO: 'wait, really?'" },
]

function buyReelInternal(s: GameState) {
  s.funds -= s.reelPrice
  s.components += s.setsPerReel
}

export function step(s: GameState, dt: number) {
  // Component reel market: noisy walk with mean reversion (chip shortages happen)
  const noise = (Math.random() - 0.5) * 30 * dt
  const revert = (s.reelBase - s.reelPrice) * 0.15 * dt
  s.reelPrice = Math.min(Math.max(s.reelPrice + noise + revert, s.reelBase * 0.55), s.reelBase * 1.7)

  // AutoReelBuyer restocks before the lines starve
  if (s.autoReelBuyer && s.components < 20 && s.funds >= s.reelPrice) {
    buyReelInternal(s)
  }

  // Automated production, limited by component stock
  const potential = productionPerSec(s) * dt + s.buildAcc
  const whole = Math.floor(potential)
  const made = Math.min(whole, Math.floor(s.components))
  if (made > 0) {
    s.components -= made
    s.inventory += made
    s.totalLoggers += made
  }
  s.buildAcc = made < whole ? 0 : potential - whole

  // Demand-limited sales
  const expected = demandPerSec(s) * dt + s.salesAcc
  const want = Math.floor(expected)
  const sold = Math.min(want, s.inventory)
  s.salesAcc = expected - want
  if (sold > 0) {
    s.inventory -= sold
    s.funds += sold * (s.price + s.pricePremium)
  }

  // Compute: ops accrue toward the cluster cap; innovation only at full ops
  const cap = opsCap(s)
  s.ops = Math.min(cap, s.ops + s.devTeams * 8 * dt)
  if (s.innovationUnlocked && cap > 0 && s.ops >= cap - 1e-9) {
    s.innovation += s.devTeams * 0.12 * dt
  }

  // Board trust at fibonacci logger milestones (2k, 3k, 5k, 8k, ...)
  while (s.totalLoggers >= s.fibB * 1000) {
    const next = s.fibA + s.fibB
    s.fibA = s.fibB
    s.fibB = next
    s.trust += 1
    pushLog(s, `Production milestone. Board trust increased (now ${s.trust}).`)
  }

  for (const m of MILESTONES) {
    if (!s.milestonesShown.includes(m.id) && m.when(s)) {
      s.milestonesShown.push(m.id)
      pushLog(s, m.msg)
    }
  }
}
