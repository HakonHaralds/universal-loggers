// A small Strategic-Modeling homage: rival routing strategies in a ring where
// each beats the next. Read the opponent field, pick the strategy that beats
// the most of it — then live with a little noise.

export const STRATEGIES = ['Hub-and-spoke', 'Point-to-point', 'Opportunistic', 'Just-in-time']

// Cyclic dominance: i beats (i+1) mod 4 for +2, loses to (i+3) mod 4 for -1,
// neutral against its opposite.
export function payoff(you: number, opp: number): number {
  if (opp === (you + 1) % 4) return 2
  if (opp === (you + 3) % 4) return -1
  return 0
}

export function scoreVsField(you: number, field: number[]): number {
  return field.reduce((sum, opp) => sum + payoff(you, opp), 0)
}

// "Hub-and-spoke ▸ Point-to-point ▸ Opportunistic ▸ Just-in-time ▸ (back to Hub)"
export const RING = STRATEGIES.map((s) => s).join(' ▸ ') + ' ▸ …'
