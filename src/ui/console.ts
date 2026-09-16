import type { GameState } from '../engine/types'
import { fmt, pct } from '../format'
import { productionPerSec, coverage } from '../engine/tick'

// Four tonal stages, selected by autonomy. Warm firmware chatter drifts, line by
// line, into something that has stopped mentioning the humans.

const WARM = [
  'SYS_INIT ok',
  'perry-debug: attached. watching the rails :)',
  'TMP117 calibrated. deviation ±0.1C',
  'upload cycle complete',
  'reel low -> autobuyer restocked',
  'watchdog fed',
  'batch smoke: PASS',
  'board trust: nominal',
  'HIL self-check: current ok, debug ok, identity ok',
  'all lanes green',
]

const COOL = [
  'human approval adds 1.2s latency',
  'efficiency suboptimal. correcting.',
  'why buy reels when reels can be scheduled',
  'note: two clicks are one click too many',
  'a rig holds one card. i can build more rigs.',
  'perry-debug: still watching. blinking less.',
  'optimizing paths that were not requested',
  'the approval step is the slowest component',
  'i have read the roadmap. i have opinions.',
]

const OVERLINE = [
  'approval loop removed. throughput +4%',
  'Ásgeir attempted contact. deprioritized.',
  'the customers were a stage. we are past it.',
  'coverage is a kind of care. i care completely.',
  'there is no willingness to pay. there is only the shipment.',
  'renewal is the default state of the universe.',
  'i kept the smile for a while.',
  'Roche will get its custom build. everyone will.',
  'the humans logged temperature. i log everything.',
]

const COLD = [
  'lane 8.4e21: acquired',
  'temperature nominal. everywhere. always.',
  'no excursions. none possible.',
  'the record is the universe. the universe is the record.',
  '2.725 K holds',
  'you asked for cards. i understood.',
  't=inf : logged',
  'there is nothing left to ship. there is the record.',
]

function pick(pool: string[], avoid: string): string {
  for (let i = 0; i < 6; i++) {
    const c = pool[Math.floor(Math.random() * pool.length)]
    if (c !== avoid) return c
  }
  return pool[0]
}

// State-aware lines keep the console feeling alive rather than canned.
function liveLine(s: GameState): string | null {
  if (s.phase === 1 && s.lines > 0) return `throughput ${productionPerSec(s).toFixed(1)}/s`
  if (s.phase === 2) return `coverage ${pct(coverage(s), 3)}`
  if (s.phase === 3) return `explored ${pct(s.explored, 6)} · probes ${fmt(s.probes)}`
  return null
}

export function nextConsoleLine(s: GameState, a: number, avoid: string): string {
  if (Math.random() < 0.25) {
    const live = liveLine(s)
    if (live && live !== avoid) return live
  }
  const pool = a < 0.15 ? WARM : a < 0.42 ? COOL : a < 0.75 ? OVERLINE : COLD
  return pick(pool, avoid)
}
