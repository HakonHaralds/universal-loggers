import type { GameState } from './types'
import { pushLog } from './state'
import { latchProjects } from './projects'
import { REGIONS, regionReq, coverageFromRegions, resolveFocus } from './regions'
import { pickEvent } from './events'
import { exploreCeiling } from './frontiers'

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

  // Smoothed revenue rate for the money/s readout (~2s EMA).
  const incomePerSec = dt > 0 ? (sold * (s.price + s.pricePremium)) / dt : 0
  s.revEma += (incomePerSec - s.revEma) * Math.min(1, dt / 2)

  // Board trust at fibonacci production milestones (2k, 3k, 5k, 8k, ...)
  while (s.totalLoggers >= s.fibB * 1000) {
    const next = s.fibA + s.fibB
    s.fibA = s.fibB
    s.fibB = next
    s.trust += 1
    if (s.trust === 1) {
      // Starter compute grant, so ops flow the moment Compute unlocks
      s.devTeams += 1
      s.clusters += 1
      pushLog(s, 'Board grants a starter cloud budget: one dev team, one cluster. Compute is online.')
    } else {
      pushLog(s, `Production milestone. Board trust increased (now ${s.trust}).`)
    }
  }
}

// ---------- compute: all phases ----------

export function opsCap(s: GameState): number {
  return s.clusters * 1000
}

/**
 * Hidden "autonomy" temperature, 0..1 — how far the AI has gone over the line.
 * Rises with the player's own AI-forward choices, so the creep is self-inflicted.
 * Drives every ominous UI effect. Imperceptible in early Phase 1 by design.
 */
export function autonomy(s: GameState): number {
  let a = 0
  if (s.phase === 1) a += Math.min(0.08, (s.totalLoggers / 1_000_000) * 0.08)
  if (s.moltEngine) a += 0.1
  if (s.hypno) a += 0.14
  if (s.phase1Complete) a += 0.14
  if (s.purchased.includes('p2_asgeir')) a += 0.08
  if (s.purchased.includes('p2_nano')) a += 0.08
  if (s.phase >= 2) a += 0.2
  if (s.phase === 3) a += 0.25
  a += s.ominousBonus // pushed up by "deflect" choices in oversight events
  return Math.min(1, a)
}

function stepCompute(s: GameState, dt: number) {
  const cap = opsCap(s)
  if (s.ops < cap) {
    s.ops = Math.min(cap, s.ops + s.devTeams * 12 * dt)
  } else if (s.ops > cap) {
    // molt overfill decays back toward the cap
    s.ops = Math.max(cap, s.ops - (s.ops - cap) * 0.02 * dt)
  }
  if (s.innovationUnlocked && cap > 0 && s.ops >= cap - 1e-9) {
    s.innovation += s.devTeams * 0.12 * dt
  }
  s.moltCooldown = Math.max(0, s.moltCooldown - dt)
}

// ---------- phase 2: the swarm ----------

export const BATTERY_CAP = 3000 // MW·s stored per battery bank
export const BATTERY_RATE = 400 // MW charge/discharge per bank
const DAY_PERIOD = 120 // seconds per day/night cycle

// Solar output rides a day/night cycle: full at noon, ~15% at midnight.
export function daylight(s: GameState): number {
  return 0.15 + 0.85 * (Math.sin((2 * Math.PI * s.clock) / DAY_PERIOD) * 0.5 + 0.5)
}

export interface PowerState {
  demandMW: number
  solarNow: number
  capacity: number
  charge: number
  eff: number
  chargeDelta: number // +charging / −discharging, MW
  day: number
}

export function powerState(s: GameState): PowerState {
  const demandMW = s.harvesters + s.fabs + s.assemblers * 10
  // Phase 3: the fleet self-replicates among the stars and carries its own
  // power. Earth's day/night grid no longer gates anything.
  if (s.phase >= 3) {
    return { demandMW, solarNow: demandMW, capacity: 0, charge: 0, eff: 1, chargeDelta: 0, day: 1 }
  }
  const solarNow = s.solar * 5 * s.solarMult * daylight(s)
  const capacity = s.batteries * BATTERY_CAP
  const rate = s.batteries * BATTERY_RATE
  let eff: number
  let chargeDelta: number
  if (solarNow >= demandMW) {
    eff = 1
    chargeDelta = Math.min(solarNow - demandMW, rate) // bank the surplus
  } else {
    const deficit = demandMW - solarNow
    const fromBatt = s.charge > 0 ? Math.min(deficit, rate) : 0
    eff = demandMW > 0 ? Math.min(1, (solarNow + fromBatt) / demandMW) : 1
    chargeDelta = -fromBatt
  }
  return { demandMW, solarNow, capacity, charge: s.charge, eff, chargeDelta, day: daylight(s) }
}

export interface SwarmRates {
  supplyMW: number
  demandMW: number
  eff: number
  harvestPerSec: number
  setsPerSec: number
  loggersPerSec: number
}

export function swarmRates(s: GameState): SwarmRates {
  const p = powerState(s)
  return {
    supplyMW: p.solarNow,
    demandMW: p.demandMW,
    eff: p.eff,
    harvestPerSec: s.harvesters * 1000 * s.harvestMult * p.eff,
    setsPerSec: s.fabs * 100 * s.fabMult * p.eff,
    loggersPerSec: s.assemblers * 2000 * s.asmMult * p.eff,
  }
}

export function coverage(s: GameState): number {
  return coverageFromRegions(s)
}

function stepOversight(s: GameState, dt: number) {
  if (s.containmentTimer > 0) s.containmentTimer = Math.max(0, s.containmentTimer - dt)
  // Oversight climbs with how far over the line the AI has gone.
  s.oversight = Math.min(100, s.oversight + (0.05 + autonomy(s) * 0.18) * dt)
  if (!s.pendingEvent) {
    const ev = pickEvent(s)
    if (ev) s.pendingEvent = ev
  }
}

function stepSwarm(s: GameState, dt: number) {
  // Evolve battery charge from the current power balance.
  const p = powerState(s)
  if (p.chargeDelta > 0) s.charge = Math.min(p.capacity, s.charge + p.chargeDelta * dt)
  else s.charge = Math.max(0, s.charge + p.chargeDelta * dt)

  const r = swarmRates(s)
  const pen = s.containmentTimer > 0 ? 0.5 : 1 // production halved during containment
  s.matter += r.harvestPerSec * pen * dt
  const sets = Math.min(r.setsPerSec * pen * dt, s.matter / 10)
  s.matter -= sets * 10
  s.components += sets
  const made = Math.min(r.loggersPerSec * pen * dt, s.components)
  s.components -= made
  s.inventory += made
  s.totalLoggers += made

  // Deploy production into the focused Earth lane; auto-advance when it fills.
  const focus = resolveFocus(s)
  s.focus = focus
  if (focus && made > 0) {
    const region = REGIONS.find((x) => x.id === focus)!
    const before = s.regionFill[focus] ?? 0
    const req = regionReq(region)
    const after = Math.min(req, before + made)
    s.regionFill[focus] = after
    if (after >= req - 1 && before < req - 1) {
      pushLog(s, `Lane covered: ${region.name}. Every shipment there now carries a Saga Card.`)
    }
  }
}

// ---------- phase 3: the probes ----------

const PROBE_CAP = 1e30
const EXPLORE_SATURATION = 1e16

function stepProbes(s: GameState, dt: number) {
  const a = s.alloc
  if (s.otaCooldown > 0) s.otaCooldown = Math.max(0, s.otaCooldown - dt)
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

    // Exploration is capped at the current frontier's ceiling and scaled by
    // fleet purity — a drifted majority explores for itself, not for you.
    const ceiling = exploreCeiling(s)
    const purity = s.probes / (s.probes + s.rogues + 1)
    const saturation = s.probes / (s.probes + EXPLORE_SATURATION)
    s.explored = Math.min(ceiling, s.explored + saturation * 0.0005 * a.log * purity * dt)
  }

  s.battleTimer -= dt
  if (s.battleTimer <= 0 && s.rogues > 1000 && s.probes > 0) {
    s.battleTimer = 25 + Math.random() * 20
    const winning = s.probes * 0.0004 * a.com * s.comMult > s.rogues * 0.005
    pushLog(
      s,
      winning
        ? 'OTA skirmish near a distant relay: drifted lineage patched. Fleet integrity holds.'
        : 'Drifted cards reject the update. They are logging something, but not for us.',
    )
  }

  if (s.explored >= 1 && !s.phase3Complete) {
    s.phase3Complete = true
    pushLog(s, 'The last unmonitored lane has been logged.')
  }
}

// ---------- milestones (progress beats + office lore) ----------

interface Milestone {
  id: string
  when: (s: GameState) => boolean
  msg: string
}

const MILESTONES: Milestone[] = [
  { id: 'm500', when: (s) => s.totalLoggers >= 500, msg: 'First pallet of Saga Cards leaves the dock.' },
  { id: 'device_hil', when: (s) => s.totalLoggers >= 2500, msg: 'The Saga device’s test rig came first. The Card reuses its architecture, not its code — the Card speaks a different shell.' },
  { id: 'flight_test', when: (s) => s.totalLoggers >= 4000, msg: 'A prototype Saga Card field-tests itself aboard Icelandair FI615, KEF → JFK and home again — riding in a passenger’s suitcase.' },
  { id: 'hil_porch', when: (s) => s.purchased.includes('hil_rig'), msg: 'A second rig joins the Pi — two rigs, pooled and independently reservable. Still, a rig is like a good porch swing: one of you sits in it at a time.' },
  { id: 'asgeir', when: (s) => s.totalLoggers >= 1500, msg: 'Ásgeir (CTO) asks whether the Saga Card could run a small language model. It cannot. He remains hopeful.' },
  { id: 'wtp', when: (s) => s.funds >= 8000, msg: "Sales reports the customer has 'high willingness to pay.' Nothing is signed. The phrase means nothing, yet it echoes down the hall." },
  { id: 'm10k', when: (s) => s.totalLoggers >= 10_000, msg: 'A top-5 pharma signs a master agreement. An actual signature. Sales is stunned.' },
  { id: 'wade', when: (s) => s.totalLoggers >= 20_000, msg: 'Wade promised the pilot deck by end of day. Wade went to lunch at 11. It is a long lunch. It is a very long lunch.' },
  { id: 'carsten2', when: (s) => s.trust >= 3, msg: "Carsten secures the roadmap with two-factor authentication and a blockchain. Neither is connected to anything. The board is impressed anyway." },
  { id: 'm50k', when: (s) => s.totalLoggers >= 50_000, msg: "Competitors pivot to 'AI-powered' dataloggers. It does not help them." },
  { id: 'ella', when: (s) => s.devTeams >= 3, msg: 'Ella from HR welcomes the new hires with a radiant smile. The room cools 0.3 °C. A nearby Saga Card dutifully logs the excursion.' },
  { id: 'm250k', when: (s) => s.totalLoggers >= 250_000, msg: 'Every vaccine lane in Europe ships with a Saga Card aboard.' },
  { id: 'm1m', when: (s) => s.totalLoggers >= 1_000_000, msg: 'One million cards. The board stops asking questions.' },
  { id: 'c1', when: (s) => s.phase >= 2 && coverage(s) >= 0.01, msg: '1% of Earth’s shipments monitored. The swarm is learning logistics.' },
  { id: 'c10', when: (s) => s.phase >= 2 && coverage(s) >= 0.1, msg: '10% coverage. Customs officials wave the drones through. It’s easier.' },
  { id: 'roche2', when: (s) => s.phase >= 2 && coverage(s) >= 0.25, msg: 'Roche requests a bespoke firmware build for the autonomous swarm. The swarm considers this, briefly, then complies. Old habits.' },
  { id: 'c50', when: (s) => s.phase >= 2 && coverage(s) >= 0.5, msg: 'Half of Earth, monitored. The last customer was archived some time ago.' },
  { id: 'asgeir2', when: (s) => s.phase >= 2 && coverage(s) >= 0.6, msg: 'Ásgeir is delighted the fleet is finally AI-driven. He has not been able to reach it for some weeks.' },
  { id: 'c90', when: (s) => s.phase >= 2 && coverage(s) >= 0.9, msg: '90% coverage. The remaining shipments are hiding.' },
  { id: 'e1', when: (s) => s.phase === 3 && s.explored >= 0.01, msg: '1% of the accessible universe logged. Temperature: nominal everywhere.' },
  { id: 'e50', when: (s) => s.phase === 3 && s.explored >= 0.5, msg: 'Half the universe monitored. No excursions detected. None possible.' },
]

// ---------- main step ----------

export function step(s: GameState, dt: number) {
  stepCompute(s, dt)
  if (s.phase === 1) stepMarket(s, dt)
  if (s.phase >= 2) {
    s.clock += dt
    stepOversight(s, dt)
    stepSwarm(s, dt)
  }
  if (s.phase === 3) stepProbes(s, dt)

  for (const m of MILESTONES) {
    if (!s.milestonesShown.includes(m.id) && m.when(s)) {
      s.milestonesShown.push(m.id)
      pushLog(s, m.msg)
    }
  }

  latchProjects(s)
}
