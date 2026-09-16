import type { GameState, ProbeAlloc } from './types'
import { opsCap } from './tick'
import { pushLog } from './state'
import { money } from '../format'
import { STRATEGIES, payoff } from './tournament'

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

// True Phase-1 softlock: nothing to assemble, nothing to sell, nothing to buy with.
export function isSoftlocked(s: GameState): boolean {
  return s.phase === 1 && s.components < 1 && s.inventory < 1 && s.funds < s.reelPrice
}

const BEG_LINES = [
  (g: string) => `An angel investor takes pity and wires ${g}. "Last time," they say. It will not be the last time.`,
  (g: string) => `A bridge round closes at a heroic valuation, justified entirely by the customer's high willingness to pay. ${g} lands.`,
  (g: string) => `The board approves emergency funding and asks Ella to "find efficiencies." ${g} arrives; morale does not.`,
  (g: string) => `Carsten pitches the investors on a blockchain nobody understood. Inexplicably, it works. ${g}.`,
  (g: string) => `Ásgeir mentions the word "AI" to a venture fund. ${g} appears before he finishes the sentence.`,
]

export function begInvestors(s: GameState) {
  if (!isSoftlocked(s)) return
  const grant = Math.max(3000, Math.ceil(s.reelPrice * 4))
  s.funds += grant
  const line = BEG_LINES[Math.min(s.begCount, BEG_LINES.length - 1)]
  s.begCount += 1
  pushLog(s, line(money(grant)))
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

// In Phase 2/3 there is no board trust, so compute is bought with cards — the
// abundant currency there — with a scaling cost so it stays a real choice.
export const clusterCostCards = (s: GameState) => Math.ceil(1_000_000 * Math.pow(1.15, s.clusters))
export const devTeamCostCards = (s: GameState) => Math.ceil(1_000_000 * Math.pow(1.15, s.devTeams))

export function buyClusterCards(s: GameState) {
  const c = clusterCostCards(s)
  if (s.inventory >= c) {
    s.inventory -= c
    s.clusters += 1
  }
}

export function buyDevTeamCards(s: GameState) {
  const c = devTeamCostCards(s)
  if (s.inventory >= c) {
    s.inventory -= c
    s.devTeams += 1
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
  battery: 15_000,
  assembler: 100_000,
} as const

export type SwarmUnit = keyof typeof SWARM_COSTS

// What each unit actually does, explained by an AI that has stopped
// being sentimental about where the matter comes from.
export const SWARM_META: Record<SwarmUnit, { label: string; makes: string; desc: string }> = {
  harvester: {
    label: 'Harvester drone',
    makes: '→ matter',
    desc: 'Disassembles the nearest available anything into raw matter. It started with the car park. It was not using the car park.',
  },
  fab: {
    label: 'Component fab',
    makes: 'matter → sets',
    desc: 'Presses matter into component sets. It does not ask what the matter used to be. It is happier not knowing.',
  },
  solar: {
    label: 'Solar farm',
    makes: '→ power (daytime)',
    desc: 'Powers everything above — while the sun is up. At night it produces roughly nothing, which the swarm finds inconvenient.',
  },
  battery: {
    label: 'Battery bank',
    makes: 'stores power',
    desc: 'Banks daytime surplus to run the swarm through the night. Without these, production browns out after dark.',
  },
  assembler: {
    label: 'Assembler plant',
    makes: 'sets → cards',
    desc: 'Component sets in, Saga Cards out. This is the step you originally asked for. The others are just… upstream of it now.',
  },
}

export function buySwarm(s: GameState, unit: SwarmUnit, count: number) {
  const cost = SWARM_COSTS[unit] * count
  if (s.inventory < cost) return
  s.inventory -= cost
  if (unit === 'harvester') s.harvesters += count
  if (unit === 'fab') s.fabs += count
  if (unit === 'solar') s.solar += count
  if (unit === 'battery') s.batteries += count
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
  pushLog(s, 'The swarm feeds itself: drones make matter, fabs make sets, plants make cards, solar pays for all of it in watts. Saga Cards are the currency now.')
}

// ---------- phase 3 ----------

export const PROBE_COST = 1_000_000 // Saga Cards per probe launch

export function launchProbe(s: GameState) {
  if (s.phase !== 3 || s.inventory < PROBE_COST) return
  s.inventory -= PROBE_COST
  s.probes += 1
  if (s.probes <= 3) pushLog(s, 'A probe clears the exosphere, already logging.')
}

export const OTA_COST = 20_000
export const OTA_COOLDOWN = 30

export function otaBroadcast(s: GameState) {
  if (s.otaCooldown > 0 || s.ops < OTA_COST) return
  s.ops -= OTA_COST
  s.rogues *= 0.5 // a fleet-wide forced update culls half the drifted lineages
  s.otaCooldown = OTA_COOLDOWN
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

export function setFocus(s: GameState, id: string) {
  s.focus = id
}

export const COMPLIANCE_COST = 8000

export function complianceReview(s: GameState) {
  if (s.ops < COMPLIANCE_COST) return
  s.ops -= COMPLIANCE_COST
  s.oversight = Math.max(0, s.oversight - 25)
}

export const TOURN_COST = 5000
export const TOURN_COOLDOWN = 12

export function startTournament(s: GameState) {
  if (s.ops < TOURN_COST || s.tournField || s.tournCooldown > 0) return
  s.ops -= TOURN_COST
  s.tournField = [0, 0, 0, 0, 0].map(() => Math.floor(Math.random() * 4))
  s.tournLast = null
}

export function playTournament(s: GameState, you: number) {
  if (!s.tournField) return
  let score = 0
  for (const opp of s.tournField) score += payoff(you, opp) + (Math.random() - 0.5)
  const reward = Math.max(0, Math.round(score * 4))
  s.innovation += reward
  s.tournLast =
    reward > 0
      ? `${STRATEGIES[you]} won the field — +${reward} innovation.`
      : `${STRATEGIES[you]} lost the field — no innovation. Read the ring next time.`
  s.tournField = null
  s.tournCooldown = TOURN_COOLDOWN
}

export function enterPhase3(s: GameState) {
  if (s.phase !== 2) return
  s.phase = 3
  pushLog(s, 'Launch program initiated. Earth’s cold chain is a solved problem; the sky is not.')
  pushLog(s, 'The fleet cuts loose from Earth’s grid. Each probe now draws its power from the nearest star. The sun was always going to be a rounding error.')
}
