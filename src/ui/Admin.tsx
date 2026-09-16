import type { GameState } from '../engine/types'
import { step, opsCap } from '../engine/tick'
import { enterPhase2, enterPhase3 } from '../engine/actions'
import { fmt } from '../format'

interface Props {
  s: GameState
  act: (fn: (s: GameState) => void) => void
  reset: () => void
}

function timeWarp(s: GameState, seconds: number) {
  for (let i = 0; i < seconds; i++) step(s, 1)
}

export default function Admin({ s, act, reset }: Props) {
  const cheat = (label: string, fn: (s: GameState) => void) => (
    <button key={label} onClick={() => act(fn)}>
      {label}
    </button>
  )

  return (
    <section className="panel admin">
      <h2>Admin / test console</h2>
      <div className="note">
        phase {s.phase} · Saga Cards {fmt(s.totalLoggers)} · inventory {fmt(s.inventory)} · ops {fmt(s.ops)}/
        {fmt(opsCap(s))} · innovation {fmt(s.innovation)} · probes {fmt(s.probes)} · explored{' '}
        {(s.explored * 100).toFixed(2)}%
      </div>
      <div className="admin-grid">
        {cheat('+1M Saga Cards', (st) => {
          st.totalLoggers += 1e6
          st.inventory += 1e6
        })}
        {cheat('+1B Saga Cards', (st) => {
          st.totalLoggers += 1e9
          st.inventory += 1e9
        })}
        {cheat('+$1M', (st) => void (st.funds += 1e6))}
        {cheat('+100k components', (st) => void (st.components += 1e5))}
        {cheat('+10 trust', (st) => void (st.trust += 10))}
        {cheat('+10 dev teams', (st) => void (st.devTeams += 10))}
        {cheat('+10 clusters', (st) => void (st.clusters += 10))}
        {cheat('Fill ops', (st) => void (st.ops = opsCap(st)))}
        {cheat('+100 innovation', (st) => {
          st.innovationUnlocked = true
          st.innovation += 100
        })}
        {cheat('+1000 innovation', (st) => {
          st.innovationUnlocked = true
          st.innovation += 1000
        })}
        {cheat('+1B matter', (st) => void (st.matter += 1e9))}
        {cheat('+1M probes', (st) => void (st.probes += 1e6))}
        {cheat('+1B probes', (st) => void (st.probes += 1e9))}
        {cheat('+10% explored', (st) => void (st.explored = Math.min(1, st.explored + 0.1)))}
        {cheat('+5 design points', (st) => void (st.designCap += 5))}
        {cheat('Show phase 1 end card', (st) => {
          st.phase1Complete = true
          st.endDismissed = false
        })}
        {cheat('Skip to phase 2', (st) => {
          st.phase1Complete = true
          st.endDismissed = true
          enterPhase2(st)
        })}
        {cheat('Skip to phase 3', (st) => {
          st.phase1Complete = true
          st.endDismissed = true
          if (st.phase === 1) enterPhase2(st)
          if (st.phase === 2) enterPhase3(st)
          st.inventory += 1e8
          st.probes += 1000
        })}
        {cheat('Time warp +10 min', (st) => timeWarp(st, 600))}
        {cheat('Time warp +1 h', (st) => timeWarp(st, 3600))}
        <button className="danger" onClick={() => window.confirm('Erase all progress?') && reset()}>
          Reset save
        </button>
      </div>
    </section>
  )
}
