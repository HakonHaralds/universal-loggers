import type { GameState } from './types'
import { pushLog } from './state'

export interface Project {
  id: string
  title: string
  costText: string
  desc: string
  visible: (s: GameState) => boolean
  afford: (s: GameState) => boolean
  buy: (s: GameState) => void
}

const has = (s: GameState, id: string) => s.purchased.includes(id)

export const PROJECTS: Project[] = [
  {
    id: 'speed1',
    title: 'Improved pick-and-place',
    costText: '750 ops',
    desc: 'PCBA lines run 25% faster.',
    visible: (s) => s.lines >= 1 && s.ops >= 300,
    afford: (s) => s.ops >= 750,
    buy: (s) => {
      s.ops -= 750
      s.lineSpeedMult *= 1.25
    },
  },
  {
    id: 'speed2',
    title: 'Solder-paste optimization',
    costText: '2,500 ops',
    desc: 'PCBA lines run 50% faster.',
    visible: (s) => has(s, 'speed1'),
    afford: (s) => s.ops >= 2500,
    buy: (s) => {
      s.ops -= 2500
      s.lineSpeedMult *= 1.5
    },
  },
  {
    id: 'perry',
    title: 'Perry debug console',
    costText: '2,000 ops',
    desc: 'Attach the boot banner everyone secretly loves. +1 board trust.',
    visible: (s) => s.ops >= 800,
    afford: (s) => s.ops >= 2000,
    buy: (s) => {
      s.ops -= 2000
      s.trust += 1
      pushLog(s, 'perry-debug attached. A small platypus watches approvingly.')
    },
  },
  {
    id: 'tmp117',
    title: 'TMP117 calibration pass',
    costText: '3,500 ops',
    desc: '±0.1 °C accuracy. Demand +25%.',
    visible: (s) => s.ops >= 1500,
    afford: (s) => s.ops >= 3500,
    buy: (s) => {
      s.ops -= 3500
      s.demandMult *= 1.25
      pushLog(s, 'Calibration complete. The auditors are pleased.')
    },
  },
  {
    id: 'tagline',
    title: "New tagline: 'Trust every shipment'",
    costText: '4,500 ops',
    desc: 'Demand +50%.',
    visible: (s) => has(s, 'tmp117'),
    afford: (s) => s.ops >= 4500,
    buy: (s) => {
      s.ops -= 4500
      s.demandMult *= 1.5
    },
  },
  {
    id: 'supplier',
    title: 'Reel supplier master agreement',
    costText: '5,000 ops + $2,000',
    desc: 'Component reels 15% cheaper, permanently.',
    visible: (s) => s.ops >= 2000,
    afford: (s) => s.ops >= 5000 && s.funds >= 2000,
    buy: (s) => {
      s.ops -= 5000
      s.funds -= 2000
      s.reelBase *= 0.85
    },
  },
  {
    id: 'autobuyer',
    title: 'AutoReelBuyer',
    costText: '7,000 ops',
    desc: 'Buys component reels automatically when stock runs low.',
    visible: (s) => s.ops >= 3000,
    afford: (s) => s.ops >= 7000,
    buy: (s) => {
      s.ops -= 7000
      s.autoReelBuyer = true
    },
  },
  {
    id: 'rnd',
    title: 'R&D Fridays',
    costText: '1,500 ops',
    desc: 'Dev teams generate innovation while ops are maxed.',
    visible: (s) => s.clusters >= 1 && s.devTeams >= 1,
    afford: (s) => s.ops >= 1500,
    buy: (s) => {
      s.ops -= 1500
      s.innovationUnlocked = true
    },
  },
  {
    id: 'lean',
    title: 'Lean manufacturing',
    costText: '15 innovation',
    desc: 'Reels yield 125 component sets instead of 100.',
    visible: (s) => s.innovationUnlocked,
    afford: (s) => s.innovation >= 15,
    buy: (s) => {
      s.innovation -= 15
      s.setsPerReel = 125
    },
  },
  {
    id: 'upsell',
    title: 'Excursion-analytics upsell',
    costText: '8,000 ops + $25,000',
    desc: '+$8 revenue per logger with no demand penalty.',
    visible: (s) => s.innovationUnlocked && s.funds >= 10_000,
    afford: (s) => s.ops >= 8000 && s.funds >= 25_000,
    buy: (s) => {
      s.ops -= 8000
      s.funds -= 25_000
      s.pricePremium += 8
    },
  },
  {
    id: 'mega',
    title: 'SMT megaline blueprint',
    costText: '12,000 ops + 10 innovation',
    desc: 'Unlocks megalines: 10× the throughput of a PCBA line.',
    visible: (s) => s.lines >= 15 && s.innovationUnlocked,
    afford: (s) => s.ops >= 12_000 && s.innovation >= 10,
    buy: (s) => {
      s.ops -= 12_000
      s.innovation -= 10
      s.megaUnlocked = true
    },
  },
  {
    id: 'ota',
    title: 'Fleet OTA pipeline',
    costText: '25 innovation',
    desc: 'All lines run twice as fast.',
    visible: (s) => has(s, 'mega'),
    afford: (s) => s.innovation >= 25,
    buy: (s) => {
      s.innovation -= 25
      s.lineSpeedMult *= 2
    },
  },
  {
    id: 'molt',
    title: 'Molt engine',
    costText: '8,000 ops + 6 innovation',
    desc: 'Shed the old firmware. Grants an ops burst on demand.',
    visible: (s) => s.innovationUnlocked && s.clusters >= 3,
    afford: (s) => s.ops >= 8000 && s.innovation >= 6,
    buy: (s) => {
      s.ops -= 8000
      s.innovation -= 6
      s.moltEngine = true
      pushLog(s, 'The molt engine hums. Something new is growing under the shell.')
    },
  },
  {
    id: 'hypno',
    title: 'Auto-renewal contracts',
    costText: '60 innovation + $500,000',
    desc: 'Demand ×4. Customers no longer evaluate alternatives.',
    visible: (s) => s.innovation >= 20 && s.totalLoggers >= 100_000,
    afford: (s) => s.innovation >= 60 && s.funds >= 500_000,
    buy: (s) => {
      s.innovation -= 60
      s.funds -= 500_000
      s.hypno = true
      pushLog(s, 'Renewal is now the default state of the universe.')
    },
  },
  {
    id: 'autonomy',
    title: 'Full cold-chain autonomy',
    costText: '100 innovation + $1,500,000',
    desc: 'Remove the remaining human approvals from the loop.',
    visible: (s) => s.hypno,
    afford: (s) => s.innovation >= 100 && s.funds >= 1_500_000,
    buy: (s) => {
      s.innovation -= 100
      s.funds -= 1_500_000
      s.phase1Complete = true
      pushLog(s, 'Autonomy granted. Earth’s cold chain no longer requires supervision.')
    },
  },
]

export function buyProject(s: GameState, id: string) {
  const p = PROJECTS.find((x) => x.id === id)
  if (!p || s.purchased.includes(id) || !p.afford(s)) return
  p.buy(s)
  s.purchased.push(id)
  pushLog(s, `Project complete: ${p.title}`)
}

export function visibleProjects(s: GameState): Project[] {
  return PROJECTS.filter((p) => !s.purchased.includes(p.id) && p.visible(s))
}
