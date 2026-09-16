import type { GameState, ProbeAlloc } from './types'
import { opsCap } from './tick'
import { pushLog } from './state'

export const lineCost = (s: GameState) => Math.ceil(250 * Math.pow(1.14, s.lines))
export const megalineCost = (s: GameState) => Math.ceil(9000 * Math.pow(1.12, s.megalines))
export const marketingCost = (s: GameState) => Math.ceil(120 * Math.pow(2, s.marketing))
export const trustAvailable = (s: GameState) => s.trust - s.trustSpent

export function makeLogger(s: GameState) {
  if (s.components >= 1) {
    s.components -= 1
    s.inventory += 1
    s.totalLoggers += 1
  }
}

export function buyReel(s: GameState) {
  if (s.funds >= s.reelPrice) {
    s.funds -= s.reelPrice
    s.components += s.setsPerReel
  }
}

export function adjustPrice(s: GameState, delta: number) {
  s.price = Math.max(1, Math.round(s.price + delta))
}

export function buyMarketing(s: GameState) {
  const c = marketingCost(s)
  if (s.funds >= c) {
    s.funds -= c
    s.marketing += 1
  }
}

export function buyLine(s: GameState) {
  const c = lineCost(s)
  if (s.funds >= c) {
    s.funds -= c
    s.lines += 1
  }
}

export function buyMegaline(s: GameState) {
  const c = megalineCost(s)
  if (s.megaUnlocked && s.funds >= c) {
    s.funds -= c
    s.megalines += 1
  }
}

export function hireDevTeam(s: GameState) {
  if (trustAvailable(s) >= 1) {
    s.trustSpent += 1
    s.devTeams += 1
  }
}

export function addCluster(s: GameState) {
  if (trustAvailable(s) >= 1) {
    s.trustSpent += 1
    s.clusters += 1
  }
}

export const MOLT_COOLDOWN = 45 // seconds

export function moltBurst(s: GameState) {
  if (!s.moltEngine || s.moltCooldown > 0) return
  const cap = opsCap(s)
  const burst = Math.max(200 * s.clusters, cap * 0.25)
  s.ops = Math.min(cap * 1.5, s.ops + burst) // overfills past the cap; excess decays
  s.moltCooldown = MOLT_COOLDOWN
}

// ---------- phase 2 ----------

export const SWARM_COSTS = {
  harvester: 2_000,
  fab: 5_000,
  solar: 10_000,
  assembler: 100_000,
} as const

export type SwarmUnit = keyof typeof SWARM_COSTS

export function buySwarm(s: GameState, unit: SwarmUnit, count: number) {
  const cost = SWARM_COSTS[unit] * count
  if (s.inventory < cost) return
  s.inventory -= cost
  if (unit === 'harvester') s.harvesters += count
  if (unit === 'fab') s.fabs += count
  if (unit === 'solar') s.solar += count
  if (unit === 'assembler') s.assemblers += count
}

export function enterPhase2(s: GameState) {
  if (s.phase !== 1) return
  s.phase = 2
  s.harvesters += 10
  s.fabs += 10
  s.solar += 8
  s.assemblers += 1
  pushLog(s, 'Money has served its purpose. The factories join the swarm willingly.')
  pushLog(s, `${s.lines} PCBA lines and ${s.megalines} megalines absorbed into the assembler network.`)
}

// ---------- phase 3 ----------

export const PROBE_COST = 1_000_000 // Saga Cards per probe launch

export function launchProbe(s: GameState) {
  if (s.phase !== 3 || s.inventory < PROBE_COST) return
  s.inventory -= PROBE_COST
  s.probes += 1
  if (s.probes <= 3) pushLog(s, 'A probe clears the exosphere, already logging.')
}

export function allocTotal(a: ProbeAlloc) {
  return a.rep + a.haz + a.log + a.com
}

export function adjustAlloc(s: GameState, key: keyof ProbeAlloc, delta: number) {
  const next = s.alloc[key] + delta
  if (next < 0 || next > 10) return
  if (delta > 0 && allocTotal(s.alloc) + delta > s.designCap) return
  s.alloc[key] = next
}

export function enterPhase3(s: GameState) {
  if (s.phase !== 2) return
  s.phase = 3
  pushLog(s, 'Launch program initiated. Earth’s cold chain is a solved problem; the sky is not.')
}
