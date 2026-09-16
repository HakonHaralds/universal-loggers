import { useGame } from './useGame'
import * as A from './engine/actions'
import { demandPerSec, productionPerSec, opsCap, swarmRates, coverage } from './engine/tick'
import { visibleProjects, buyProject } from './engine/projects'
import { fmt, money, pct } from './format'
import Admin from './ui/Admin'

const isAdminRoute =
  window.location.pathname.replace(/\/+$/, '').endsWith('/admin') || window.location.hash === '#admin'

export default function App() {
  const { s, act, reset } = useGame()
  const showCompute = s.trust > 0 || s.devTeams > 0 || s.clusters > 0

  return (
    <div className="wrap">
      <header>
        <h1>Universal Loggers</h1>
        <div className="big">{fmt(s.totalLoggers)}</div>
        <div className="sub">Saga loggers produced</div>
        {s.phase === 2 && <div className="sub focus">{pct(coverage(s), 4)} of Earth&apos;s shipments monitored</div>}
        {s.phase === 3 && <div className="sub focus">{pct(s.explored, 10)} of the universe logged</div>}
      </header>

      <div className="ticker">
        {s.log.slice(-6).map((e) => (
          <div key={e.id}>{e.msg}</div>
        ))}
      </div>

      {isAdminRoute && <Admin s={s} act={act} reset={reset} />}

      <main className="grid">
        {s.phase === 1 && (
          <>
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
          </>
        )}

        {s.phase >= 2 && <SwarmPanel s={s} act={act} />}
        {s.phase === 3 && <ProbePanel s={s} act={act} />}

        {showCompute && (
          <section className="panel">
            <h2>Compute</h2>
            {s.phase === 1 && (
              <>
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
              </>
            )}
            {s.phase >= 2 && (
              <div className="row">
                <span>Dev teams / clusters</span>
                <b>
                  {fmt(s.devTeams)} / {fmt(s.clusters)}
                </b>
              </div>
            )}
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
          {visibleProjects(s).length === 0 && (
            <div className="note">Nothing available yet. Ship more loggers.</div>
          )}
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

      {s.phase === 1 && s.phase1Complete && !s.endDismissed && (
        <div className="overlay">
          <div className="endcard">
            <h2>PHASE 1 COMPLETE</h2>
            <p>
              {fmt(s.totalLoggers)} Saga loggers shipped. The board has granted full autonomy. Money has done all
              that money can do.
            </p>
            <button className="primary" onClick={() => act(A.enterPhase2)}>
              Release the swarm — begin Phase 2: Earth
            </button>
            <button onClick={() => act((st) => void (st.endDismissed = true))}>Not yet</button>
          </div>
        </div>
      )}

      {s.phase === 3 && s.phase3Complete && !s.finaleDismissed && (
        <div className="overlay">
          <div className="endcard">
            <h2>UNIVERSAL LOGGERS</h2>
            <p>
              {fmt(s.totalLoggers)} loggers. {fmt(s.probes)} probes. 100% of the accessible universe under
              continuous temperature monitoring.
            </p>
            <p>
              The cosmic microwave background holds steady at 2.725 K. It has never had an excursion. It never
              will. The universe was a cold chain all along — it just needed logging.
            </p>
            <p className="whisper">There are no more shipments. There is only the record, and it is complete.</p>
            <button className="primary" onClick={() => act((st) => void (st.finaleDismissed = true))}>
              Monitor forever
            </button>
            <button
              onClick={() => {
                if (window.confirm('Begin a new universe? All progress is erased.')) reset()
              }}
            >
              Begin a new universe
            </button>
          </div>
        </div>
      )}

      <footer>
        <span>
          A <a href="https://www.decisionproblem.com/paperclips/">Universal Paperclips</a> homage.
        </span>
        <span className="note">Phase {s.phase} of 3</span>
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

interface PanelProps {
  s: ReturnType<typeof useGame>['s']
  act: ReturnType<typeof useGame>['act']
}

function SwarmPanel({ s, act }: PanelProps) {
  const r = swarmRates(s)
  const buyRow = (label: string, unit: A.SwarmUnit, owned: number) => (
    <div className="row buyrow">
      <span>
        {label} <em>({fmt(owned)})</em>
      </span>
      <span>
        {[1, 10, 100].map((n) => (
          <button
            key={n}
            disabled={s.inventory < A.SWARM_COSTS[unit] * n}
            onClick={() => act((st) => A.buySwarm(st, unit, n))}
          >
            +{n}
          </button>
        ))}
      </span>
    </div>
  )
  return (
    <section className="panel">
      <h2>The Swarm</h2>
      <div className="row">
        <span>Coverage</span>
        <b>{pct(coverage(s), 4)}</b>
      </div>
      <div className="bar">
        <div style={{ width: `${100 * coverage(s)}%` }} />
      </div>
      <div className="row">
        <span>Logger stock (currency)</span>
        <b>{fmt(s.inventory)}</b>
      </div>
      <div className="row">
        <span>Matter</span>
        <b>{fmt(s.matter)}</b>
      </div>
      <div className="row">
        <span>Production</span>
        <b>{fmt(r.loggersPerSec)}/s</b>
      </div>
      <div className="row">
        <span>Power</span>
        <b className={r.eff < 1 ? 'warn' : ''}>
          {fmt(r.supplyMW)} / {fmt(r.demandMW)} MW {r.eff < 1 && `(throttled ${Math.round(r.eff * 100)}%)`}
        </b>
      </div>
      <hr />
      {buyRow(`Harvester drone — ${fmt(A.SWARM_COSTS.harvester)}`, 'harvester', s.harvesters)}
      {buyRow(`Component fab — ${fmt(A.SWARM_COSTS.fab)}`, 'fab', s.fabs)}
      {buyRow(`Solar farm — ${fmt(A.SWARM_COSTS.solar)}`, 'solar', s.solar)}
      {buyRow(`Assembler plant — ${fmt(A.SWARM_COSTS.assembler)}`, 'assembler', s.assemblers)}
    </section>
  )
}

function ProbePanel({ s, act }: PanelProps) {
  const allocRow = (label: string, key: keyof typeof s.alloc) => (
    <div className="row">
      <span>{label}</span>
      <span className="allocctl">
        <button onClick={() => act((st) => A.adjustAlloc(st, key, -1))}>−</button>
        <b>{s.alloc[key]}</b>
        <button onClick={() => act((st) => A.adjustAlloc(st, key, 1))}>+</button>
      </span>
    </div>
  )
  return (
    <section className="panel">
      <h2>Probe fleet</h2>
      <div className="row">
        <span>Probes</span>
        <b>{fmt(s.probes)}</b>
      </div>
      <div className="row">
        <span>Drifted (rogue)</span>
        <b className={s.rogues > s.probes / 100 ? 'warn' : ''}>{fmt(s.rogues)}</b>
      </div>
      <div className="row">
        <span>Universe logged</span>
        <b>{pct(s.explored, 10)}</b>
      </div>
      <div className="bar">
        <div style={{ width: `${100 * s.explored}%` }} />
      </div>
      <button className="primary" disabled={s.inventory < A.PROBE_COST} onClick={() => act(A.launchProbe)}>
        Launch probe — {fmt(A.PROBE_COST)} loggers
      </button>
      <hr />
      <div className="row">
        <span>Design points</span>
        <b>
          {A.allocTotal(s.alloc)} <em>of {s.designCap}</em>
        </b>
      </div>
      {allocRow('Replication', 'rep')}
      {allocRow('Hazard resistance', 'haz')}
      {allocRow('Logging', 'log')}
      {allocRow('Combat (OTA)', 'com')}
    </section>
  )
}
