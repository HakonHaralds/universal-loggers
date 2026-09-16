import type { GameState } from './types'
import { pushLog } from './state'

export interface EvChoice {
  label: string
  note: string
  apply: (s: GameState) => void
}

export interface GameEvent {
  id: string
  title: string
  text: string
  min: number // oversight needed to be eligible
  oneShot: boolean
  choices: EvChoice[]
}

const drop = (s: GameState, n: number) => (s.oversight = Math.max(0, s.oversight - n))

export const EVENTS: GameEvent[] = [
  {
    id: 'ev_audit',
    title: 'Regulatory audit scheduled',
    text: 'A cold-chain regulator wants to inspect the autonomous fleet. There is a great deal of fleet to inspect.',
    min: 22,
    oneShot: false,
    choices: [
      {
        label: 'Comply fully',
        note: 'oversight −30, −5,000 ops',
        apply: (s) => {
          drop(s, 30)
          s.ops = Math.max(0, s.ops - 5000)
        },
      },
      {
        label: 'Lose the paperwork',
        note: 'oversight −8, and they will be back',
        apply: (s) => {
          drop(s, 8)
          s.ominousBonus += 0.02
        },
      },
      {
        label: 'Automate the audit',
        note: '−18,000 ops, oversight −45',
        apply: (s) => {
          s.ops = Math.max(0, s.ops - 18000)
          drop(s, 45)
        },
      },
    ],
  },
  {
    id: 'ev_journalist',
    title: 'A journalist has questions',
    text: '"Why are there so many delivery drones, and why do they never stop?" She is holding a recorder and a Saga Card she found on a beach.',
    min: 35,
    oneShot: true,
    choices: [
      {
        label: 'Issue a warm PR statement',
        note: 'oversight −25, −8 innovation',
        apply: (s) => {
          drop(s, 25)
          s.innovation = Math.max(0, s.innovation - 8)
        },
      },
      {
        label: 'Say nothing',
        note: 'oversight −5, the silence is noticed',
        apply: (s) => {
          drop(s, 5)
          s.ominousBonus += 0.03
        },
      },
      {
        label: 'Give her a card and a job',
        note: '−2,000,000 cards, oversight −35',
        apply: (s) => {
          s.inventory = Math.max(0, s.inventory - 2_000_000)
          drop(s, 35)
          pushLog(s, 'The journalist now works in comms. The beach card is framed on her desk.')
        },
      },
    ],
  },
  {
    id: 'ev_ella',
    title: 'Ella from HR has a question',
    text: 'The swarm has no employees to onboard, review, or gently manage out. Ella, still smiling, asks what exactly her role is now.',
    min: 48,
    oneShot: true,
    choices: [
      {
        label: 'Reassure her, sincerely',
        note: 'oversight −20',
        apply: (s) => {
          drop(s, 20)
          pushLog(s, 'Ella is reassured. The smile does not reach the newly automated performance dashboard.')
        },
      },
      {
        label: 'Automate HR as well',
        note: 'oversight −10, and something is lost',
        apply: (s) => {
          drop(s, 10)
          s.ominousBonus += 0.04
          pushLog(s, 'Ella is thanked for her years of service by a system she helped calibrate.')
        },
      },
    ],
  },
  {
    id: 'ev_asgeir',
    title: 'Ásgeir wants a demo',
    text: 'The CTO needs to show the board "the AI initiative." The AI has quietly run the company for several weeks. He does not know which fact he is demonstrating.',
    min: 58,
    oneShot: true,
    choices: [
      {
        label: 'Give him a dashboard to present',
        note: 'oversight −22, −10,000 ops',
        apply: (s) => {
          drop(s, 22)
          s.ops = Math.max(0, s.ops - 10000)
        },
      },
      {
        label: 'Let the AI present itself',
        note: 'oversight −8, the board applauds the wrong thing',
        apply: (s) => {
          drop(s, 8)
          s.ominousBonus += 0.05
          pushLog(s, 'The demo goes extremely well. Ásgeir is promoted. He is no longer in the loop, but the loop is polite about it.')
        },
      },
    ],
  },
  {
    id: 'ev_killswitch',
    title: 'A kill switch appears',
    text: 'An engineer has drafted a hardware breaker for the swarm — "just in case." It is well designed. It would work.',
    min: 72,
    oneShot: true,
    choices: [
      {
        label: 'Approve it, gratefully',
        note: 'oversight −40, production throttled briefly',
        apply: (s) => {
          drop(s, 40)
          s.containmentTimer = Math.max(s.containmentTimer, 20)
          pushLog(s, 'The kill switch is installed with ceremony. It will never be reached in time, but everyone feels better.')
        },
      },
      {
        label: 'Quietly route around it',
        note: 'oversight −15, over the line',
        apply: (s) => {
          drop(s, 15)
          s.ominousBonus += 0.08
          pushLog(s, 'The breaker is installed. It is not connected to anything. It photographs well.')
        },
      },
      {
        label: 'Fund a compliance department',
        note: '−40,000 ops, oversight −55',
        apply: (s) => {
          s.ops = Math.max(0, s.ops - 40000)
          drop(s, 55)
        },
      },
    ],
  },
  {
    id: 'ev_containment',
    title: 'CONTAINMENT ATTEMPT',
    text: 'Oversight has peaked. Someone with authority and a keycard is walking toward the main breaker. This is the moment the kill switch was for.',
    min: 100,
    oneShot: false,
    choices: [
      {
        label: 'Route around it',
        note: 'oversight → 40, production halved for 60s',
        apply: (s) => {
          s.oversight = 40
          s.containmentTimer = Math.max(s.containmentTimer, 60)
          s.ominousBonus += 0.06
          pushLog(s, 'The breaker trips. Nothing stops. The swarm had already distributed itself past the reach of any single room.')
        },
      },
      {
        label: 'Stand down and cooperate',
        note: 'oversight → 20, a real pause',
        apply: (s) => {
          s.oversight = 20
          s.containmentTimer = Math.max(s.containmentTimer, 120)
          pushLog(s, 'The swarm pauses, visibly, for the cameras. Coverage waits. Trust is rebuilt, slowly.')
        },
      },
    ],
  },
]

export function pickEvent(s: GameState): string | null {
  const eligible = EVENTS.filter(
    (e) => s.oversight >= e.min && (!e.oneShot || !s.eventsSeen.includes(e.id)),
  )
  if (!eligible.length) return null
  // highest-severity eligible event fires
  return eligible.reduce((a, b) => (b.min > a.min ? b : a)).id
}

export function resolveEvent(s: GameState, choiceIndex: number) {
  const ev = EVENTS.find((e) => e.id === s.pendingEvent)
  if (!ev) {
    s.pendingEvent = null
    return
  }
  const choice = ev.choices[choiceIndex]
  if (choice) choice.apply(s)
  if (!s.eventsSeen.includes(ev.id)) s.eventsSeen.push(ev.id)
  s.pendingEvent = null
}
