import type { GameState } from './types'
import { pushLog, EARTH_NEED } from './state'
import { latchProjects } from './projects'

// ---------- phase 1: the business ----------

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

function stepMarket(s: GameState, dt: number) {
  // Component reel market: noisy walk with mean reversion (chip shortages happen)
  const noise = (Math.random() - 0.5) * 30 * dt
  const revert = (s.reelBase - s.reelPrice) * 0.15 * dt
  s.reelPrice = Math.min(Math.max(s.reelPrice + noise + revert, s.reelBase * 0.55), s.reelBase * 1.7)

  if (s.autoReelBuyer && s.components < 20 && s.funds >= s.reelPrice) {
    s.funds -= s.reelPrice
    s.components += s.setsPerReel
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

  // Board trust at fibonacci logger milestones (2k, 3k, 5k, 8k, ...)
  while (s.totalLoggers >= s.fibB * 1000) {
    const next = s.fibA + s.fibB
    s.fibA = s.fibB
    s.fibB = next
    s.trust += 1
    pushLog(s, `Production milestone. Board trust increased (now ${s.trust}).`)
  }
}

// ---------- compute: all phases ----------

export function opsCap(s: GameState): number {
  return s.clusters * 1000
}

function stepCompute(s: GameState, dt: number) {
  const cap = opsCap(s)
  s.ops = Math.min(cap, s.ops + s.devTeams * 8 * dt)
  if (s.innovationUnlocked && cap > 0 && s.ops >= cap - 1e-9) {
    s.innovation += s.devTeams * 0.12 * dt
  }
}

// ---------- phase 2: the swarm ----------

export interface SwarmRates {
  supplyMW: number
  demandMW: number
  eff: number
  harvestPerSec: number
  setsPerSec: number
  loggersPerSec: number
}

export function swarmRates(s: GameState): SwarmRates {
  const demandMW = s.harvesters + s.fabs + s.assemblers * 10
  const supplyMW = s.solar * 5 * s.solarMult
  const eff = demandMW > 0 ? Math.min(1, supplyMW / demandMW) : 1
  return {
    supplyMW,
    demandMW,
    eff,
    harvestPerSec: s.harvesters * 1000 * s.harvestMult * eff,
    setsPerSec: s.fabs * 100 * s.fabMult * eff,
    loggersPerSec: s.assemblers * 2000 * s.asmMult * eff,
  }
}

export function coverage(s: GameState): number {
  return Math.min(1, s.totalLoggers / EARTH_NEED)
}

function stepSwarm(s: GameState, dt: number) {
  const r = swarmRates(s)
  s.matter += r.harvestPerSec * dt
  const sets = Math.min(r.setsPerSec * dt, s.matter / 10)
  s.matter -= sets * 10
  s.components += sets
  const made = Math.min(r.loggersPerSec * dt, s.components)
  s.components -= made
  s.inventory += made
  s.totalLoggers += made
}

// ---------- phase 3: the probes ----------

// Von Neumann growth is fun until it overflows a double. The fleet
// saturates at the causally-reachable manufacturing ceiling.
const PROBE_CAP = 1e30
// Exploration rate saturates once the fleet dwarfs the remaining lanes.
const EXPLORE_SATURATION = 1e16

function stepProbes(s: GameState, dt: number) {
  const a = s.alloc
  if (s.probes > 0) {
    const growth = s.probes * 0.004 * a.rep * dt
    const drift = growth * s.driftFrac
    s.probes += growth - drift
    s.rogues += drift + s.rogues * 0.004 * dt

    const kills = Math.min(s.rogues, s.probes * 0.0004 * a.com * s.comMult * dt)
    s.rogues -= kills

    const hazLoss = s.probes * Math.max(0, 0.006 - 0.002 * a.haz) * dt
    const rogueLoss = Math.min(s.probes * 0.5, s.rogues * 0.001 * dt)
    s.probes = Math.max(0, s.probes - hazLoss - rogueLoss)

    s.probes = Math.min(s.probes, PROBE_CAP)
    s.rogues = Math.min(s.rogues, PROBE_CAP)

    const saturation = s.probes / (s.probes + EXPLORE_SATURATION)
    s.explored = Math.min(1, s.explored + saturation * 0.0004 * a.log * dt)
  }

  s.battleTimer -= dt
  if (s.battleTimer <= 0 && s.rogues > 1000 && s.probes > 0) {
    s.battleTimer = 25 + Math.random() * 20
    const winning = s.probes * 0.0004 * a.com * s.comMult > s.rogues * 0.005
    pushLog(
      s,
      winning
        ? 'OTA skirmish near a distant relay: drifted lineage patched. Fleet integrity holds.'
        : 'Drifted probes reject the update. They are logging something, but not for us.',
    )
  }

  if (s.explored >= 1 && !s.phase3Complete) {
    s.phase3Complete = true
    pushLog(s, 'The last unmonitored lane has been logged.')
  }
}

// ---------- milestones ----------

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
  { id: 'c1', when: (s) => s.phase >= 2 && coverage(s) >= 0.01, msg: '1% of Earth’s shipments monitored. The swarm is learning logistics.' },
  { id: 'c10', when: (s) => s.phase >= 2 && coverage(s) >= 0.1, msg: '10% coverage. Customs officials wave the drones through. It’s easier.' },
  { id: 'c50', when: (s) => s.phase >= 2 && coverage(s) >= 0.5, msg: 'Half of Earth, monitored. The last customer was archived some time ago.' },
  { id: 'c90', when: (s) => s.phase >= 2 && coverage(s) >= 0.9, msg: '90% coverage. The remaining shipments are hiding.' },
  { id: 'e1', when: (s) => s.phase === 3 && s.explored >= 0.01, msg: '1% of the accessible universe logged. Temperature: nominal everywhere.' },
  { id: 'e50', when: (s) => s.phase === 3 && s.explored >= 0.5, msg: 'Half the universe monitored. No excursions detected. None possible.' },
]

// ---------- main step ----------

export function step(s: GameState, dt: number) {
  stepCompute(s, dt)
  if (s.phase === 1) stepMarket(s, dt)
  if (s.phase >= 2) stepSwarm(s, dt)
  if (s.phase === 3) stepProbes(s, dt)

  for (const m of MILESTONES) {
    if (!s.milestonesShown.includes(m.id) && m.when(s)) {
      s.milestonesShown.push(m.id)
      pushLog(s, m.msg)
    }
  }

  latchProjects(s)
}
