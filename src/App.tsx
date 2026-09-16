import { useGame } from './useGame'
import * as A from './engine/actions'
import { demandPerSec, productionPerSec, opsCap } from './engine/tick'
import { visibleProjects, buyProject } from './engine/projects'

const fmt = (n: number) => Math.floor(n).toLocaleString('en-US')
const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function App() {
  const { s, act, reset } = useGame()
  const showCompute = s.trust > 0 || s.devTeams > 0 || s.clusters > 0

  return (
    <div className="wrap">
      <header>
        <h1>Universal Loggers</h1>
        <div className="big">{fmt(s.totalLoggers)}</div>
        <div className="sub">Saga loggers shipped</div>
      </header>

      <div className="ticker">
        {s.log.slice(-6).map((e) => (
          <div key={e.id}>{e.msg}</div>
        ))}
      </div>

      <main className="grid">
        <section className="panel">
          <h2>Manufacturing</h2>
          <button className="primary" disabled={s.components < 1} onClick={() => act(A.makeLogger)}>
            Assemble Logger
          </button>
          <div className="row">
            <span>Component sets</span>
            <b>{fmt(s.components)}</b>
          </div>
          <button disabled={s.funds < s.reelPrice} onClick={() => act(A.buyReel)}>
            Buy reel ({s.setsPerReel} sets) — {money(s.reelPrice)}
          </button>
          {s.autoReelBuyer && <div className="note">AutoReelBuyer active</div>}
          <hr />
          <button disabled={s.funds < A.lineCost(s)} onClick={() => act(A.buyLine)}>
            PCBA line — {money(A.lineCost(s))}
          </button>
          <div className="row">
            <span>PCBA lines</span>
            <b>{s.lines}</b>
          </div>
          {s.megaUnlocked && (
            <>
              <button disabled={s.funds < A.megalineCost(s)} onClick={() => act(A.buyMegaline)}>
                SMT megaline — {money(A.megalineCost(s))}
              </button>
              <div className="row">
                <span>Megalines</span>
                <b>{s.megalines}</b>
              </div>
            </>
          )}
          <div className="row">
            <span>Throughput</span>
            <b>{productionPerSec(s).toFixed(1)}/s</b>
          </div>
        </section>

        <section className="panel">
          <h2>Business</h2>
          <div className="row">
            <span>Available funds</span>
            <b>{money(s.funds)}</b>
          </div>
          <div className="row">
            <span>Unsold inventory</span>
            <b>{fmt(s.inventory)}</b>
          </div>
          <div className="row price">
            <span>Price per logger</span>
            <span>
              <button onClick={() => act((st) => A.adjustPrice(st, -1))}>−</button>
              <b>
                {money(s.price)}
                {s.pricePremium > 0 && <em> +{money(s.pricePremium)} analytics</em>}
              </b>
              <button onClick={() => act((st) => A.adjustPrice(st, 1))}>+</button>
            </span>
          </div>
          <div className="row">
            <span>Demand</span>
            <b>{demandPerSec(s).toFixed(2)}/s</b>
          </div>
          <hr />
          <button disabled={s.funds < A.marketingCost(s)} onClick={() => act(A.buyMarketing)}>
            Marketing (lvl {s.marketing}) — {money(A.marketingCost(s))}
          </button>
          {s.hypno && <div className="note">Auto-renewal contracts in force</div>}
        </section>

        {showCompute && (
          <section className="panel">
            <h2>Compute</h2>
            <div className="row">
              <span>Board trust</span>
              <b>
                {A.trustAvailable(s)} <em>of {s.trust}</em>
              </b>
            </div>
            <button disabled={A.trustAvailable(s) < 1} onClick={() => act(A.hireDevTeam)}>
              Hire dev team ({s.devTeams})
            </button>
            <button disabled={A.trustAvailable(s) < 1} onClick={() => act(A.addCluster)}>
              Add cloud cluster ({s.clusters})
            </button>
            <div className="row">
              <span>ops</span>
              <b>
                {fmt(s.ops)} <em>/ {fmt(opsCap(s))}</em>
              </b>
            </div>
            <div className="bar">
              <div style={{ width: opsCap(s) > 0 ? `${(100 * s.ops) / opsCap(s)}%` : '0%' }} />
            </div>
            {s.innovationUnlocked && (
              <div className="row">
                <span>Innovation</span>
                <b>{s.innovation.toFixed(1)}</b>
              </div>
            )}
            {s.moltEngine && (
              <button onClick={() => act(A.moltBurst)}>Molt (+{fmt(200 * s.clusters)} ops)</button>
            )}
          </section>
        )}

        <section className="panel projects">
          <h2>Projects</h2>
          {visibleProjects(s).length === 0 && <div className="note">Nothing available yet. Ship more loggers.</div>}
          {visibleProjects(s).map((p) => (
            <button
              key={p.id}
              className="project"
              disabled={!p.afford(s)}
              onClick={() => act((st) => buyProject(st, p.id))}
            >
              <b>
                {p.title} <em>({p.costText})</em>
              </b>
              <span>{p.desc}</span>
            </button>
          ))}
        </section>
      </main>

      {s.phase1Complete && !s.endDismissed && (
        <div className="overlay">
          <div className="endcard">
            <h2>PHASE 1 COMPLETE</h2>
            <p>
              {fmt(s.totalLoggers)} Saga loggers shipped. Earth&apos;s cold chain is fully autonomous. No shipment
              travels unwatched; no excursion goes unlogged.
            </p>
            <p>
              <b>Phase 2: Earth</b> — coming soon.
            </p>
            <p className="whisper">Somewhere, at 2.725 K, the universe waits to be monitored.</p>
            <button className="primary" onClick={() => act((st) => void (st.endDismissed = true))}>
              Keep optimizing
            </button>
          </div>
        </div>
      )}

      <footer>
        <span>
          A <a href="https://www.decisionproblem.com/paperclips/">Universal Paperclips</a> homage.
        </span>
        <button
          className="danger"
          onClick={() => {
            if (window.confirm('Erase all progress?')) reset()
          }}
        >
          Reset game
        </button>
      </footer>
    </div>
  )
}
