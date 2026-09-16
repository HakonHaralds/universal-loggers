import type { GameState } from './types'

// Exploration proceeds through named cosmic frontiers. Each is gated behind a
// probe-tech project, so 'explored' stalls at a frontier's ceiling until you
// unlock the next — giving Phase 3 targets instead of one endless bar.
export interface Frontier {
  id: string
  name: string
  cap: number
  gate: string | null // project id
}

export const FRONTIERS: Frontier[] = [
  { id: 'solar', name: 'The Solar System', cap: 0.05, gate: null },
  { id: 'stars', name: 'Nearby Stars', cap: 0.2, gate: 'f_interstellar' },
  { id: 'galaxy', name: 'The Galaxy', cap: 0.5, gate: 'f_galactic' },
  { id: 'localgroup', name: 'The Local Group', cap: 0.8, gate: 'f_intergalactic' },
  { id: 'universe', name: 'The Observable Universe', cap: 1.0, gate: 'f_cosmic' },
]

// The deepest cap reachable given which gates are bought (must be contiguous).
export function exploreCeiling(s: GameState): number {
  let ceiling = FRONTIERS[0].cap
  for (let i = 1; i < FRONTIERS.length; i++) {
    const f = FRONTIERS[i]
    if (f.gate && s.purchased.includes(f.gate)) ceiling = f.cap
    else break
  }
  return ceiling
}

// The frontier the fleet is currently working (for display).
export function currentFrontier(s: GameState): Frontier {
  for (const f of FRONTIERS) {
    if (s.explored < f.cap - 1e-9) return f
  }
  return FRONTIERS[FRONTIERS.length - 1]
}

// The next locked frontier whose gate you still need (or null if all unlocked).
export function nextGate(s: GameState): Frontier | null {
  for (const f of FRONTIERS) {
    if (f.gate && !s.purchased.includes(f.gate)) return f
  }
  return null
}
