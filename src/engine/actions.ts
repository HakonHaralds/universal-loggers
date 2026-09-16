import type { GameState } from './types'
import { opsCap } from './tick'

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

export function moltBurst(s: GameState) {
  if (s.moltEngine) {
    s.ops = Math.min(opsCap(s), s.ops + 200 * s.clusters)
  }
}
