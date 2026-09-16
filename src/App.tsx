import { useEffect, useRef } from 'react'
import { useGame } from './useGame'
import * as A from './engine/actions'
import { demandPerSec, productionPerSec, opsCap, swarmRates, coverage, autonomy, powerState } from './engine/tick'
import { visibleProjects, buyProject } from './engine/projects'
import { fmt, money, pct, headline } from './format'
import { REGIONS, regionReq, regionFillOf, regionUnlocked, regionFull } from './engine/regions'
import { EVENTS, resolveEvent } from './engine/events'
import { STRATEGIES, RING } from './engine/tournament'
import { SagaCard, Perry } from './ui/art'
import { PerryConsole } from './ui/PerryConsole'
import { Glitch, Bleed, accentFor } from './ui/fx'
import Admin from './ui/Admin'

const isAdminRoute =
  window.location.pathname.replace(/\/+$/, '').endsWith('/admin') || window.location.hash === '#admin'
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  const { s, act, reset } = useGame()
  const showCompute = s.trust > 0 || s.devTeams > 0 || s.clusters > 0
  const hasPerry = s.purchased.includes('perry')

  const a = autonomy(s)
  const fxColor = s.stabilizeUI ? 0 : a // palette, console tone, Perry tint (not "motion")
  const fxMotion = s.stabilizeUI || reducedMotion ? 0 : a // glitch, bleed, cursor-tracking, tint
  const fxRef = useRef(0)
  fxRef.current = fxMotion

  // Palette drift: warm brand blue slowly cools toward cyan-green as autonomy climbs.
  const fxq = Math.round(fxColor * 40) / 40
  useEffect(() => {
    const root = document.documentElement
    if (fxq <= 0.001) root.style.removeProperty('--accent')
    else root.style.setProperty('--accent', accentFor(fxq))
  }, [fxq])

  const tintOpacity = fxMotion > 0.3 ? ((fxMotion - 0.3) / 0.7) * 0.09 : 0

  return (
    <div className="wrap">
      <div className="coldtint" style={{ opacity: tintOpacity }} aria-hidden />

      <header>
        <div className="hero">
          <SagaCard size={128} />
          <div className="hero-num">
            <h1>
              <Glitch text="Universal Saga Cards" fxRef={fxRef} />
            </h1>
            <div className="big">{headline(s.totalLoggers)}</div>
            <div className="sub">
              <Bleed normal="Saga Cards produced" alt="units secured" fxRef={fxRef} />
            </div>
          </div>
        </div>
        {s.phase === 2 && <div className="sub focus">{pct(coverage(s), 4)} of Earth&apos;s shipments monitored</div>}
        {s.phase === 3 && <div className="sub focus">{pct(s.explored, 10)} of the universe logged</div>}
        {s.phase === 1 && s.phase1Complete && s.endDismissed && (
          <button className="primary inline" onClick={() => act(A.enterPhase2)}>
            Release the swarm — begin Phase 2: Earth
          </button>
        )}
      </header>

      <div className="ticker">
        {s.log.slice(-6).map((e) => (
          <div key={e.id}>{e.msg}</div>
        ))}
      </div>

      {s.pendingEvent && <EventCard s={s} act={act} />}
      {hasPerry && <PerryConsole s={s} a={fxColor} />}
      {isAdminRoute && <Admin s={s} act={act} reset={reset} />}

      <main className="grid">
        {s.phase === 1 && (
          <>
            <section className="panel">
              <h2>Manufacturing</h2>
              <button className="primary" disabled={s.components < 1} onClick={() => act(A.makeLogger)}>
                Assemble Saga Card
              </button>
              {A.isSoftlocked(s) && (
                <button className="beg" onClick={() => act(A.begInvestors)}>
                  🥺 Beg investors — out of cards, cash, and components
                </button>
              )}
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
                <span>
                  <Bleed normal="Available funds" alt="resources" fxRef={fxRef} />
                </span>
                <b>{money(s.funds)}</b>
              </div>
              <div className="row">
                <span>Unsold inventory</span>
                <b>{fmt(s.inventory)}</b>
              </div>
              <div className="row price">
                <span>Price per card</span>
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
                <span>
                  <Bleed normal="Demand" alt="compliance" fxRef={fxRef} />
                </span>
                <b>{demandPerSec(s).toFixed(2)}/s</b>
              </div>
              {s.purchased.includes('finance') && (
                <div className="row">
                  <span>Revenue</span>
                  <b>{money(s.revEma)}/s</b>
                </div>
              )}
              <hr />
              <button disabled={s.funds < A.marketingCost(s)} onClick={() => act(A.buyMarketing)}>
                Marketing (lvl {s.marketing}) — {money(A.marketingCost(s))}
              </button>
              {s.hypno && <div className="note">Auto-renewal contracts in force</div>}
            </section>
          </>
        )}

        {s.phase >= 2 && <SwarmPanel s={s} act={act} />}
        {s.phase === 2 && <RegionPanel s={s} act={act} />}
        {s.phase >= 2 && <OversightPanel s={s} act={act} />}
        {s.phase >= 2 && s.purchased.includes('tournament') && <TournamentPanel s={s} act={act} />}
        {s.phase === 3 && <ProbePanel s={s} act={act} />}

        {showCompute && (
          <section className="panel">
            <h2>
              <Glitch text="Compute" fxRef={fxRef} />
            </h2>
            {s.phase === 1 && (
              <>
                <div className="row">
                  <span>Board trust</span>
                  <b>
                    {A.trustAvailable(s)} <em>of {s.trust}</em>
                  </b>
                </div>
                <div className="row subtle">
                  <span>Next trust at</span>
                  <b>{fmt(s.fibB * 1000)} cards</b>
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
              <div
                className={s.ops > opsCap(s) ? 'overfill' : ''}
                style={{ width: opsCap(s) > 0 ? `${Math.min(100, (100 * s.ops) / opsCap(s))}%` : '0%' }}
              />
            </div>
            {s.innovationUnlocked && (
              <div className="row">
                <span>Innovation</span>
                <b>{s.innovation.toFixed(1)}</b>
              </div>
            )}
            {s.moltEngine && (
              <button disabled={s.moltCooldown > 0} onClick={() => act(A.moltBurst)}>
                {s.moltCooldown > 0
                  ? `Molting… (${Math.ceil(s.moltCooldown)}s)`
                  : `Molt (+${fmt(Math.max(200 * s.clusters, opsCap(s) * 0.25))} ops, overfills)`}
              </button>
            )}
          </section>
        )}

        <section className="panel projects">
          <h2>
            <Glitch text="Projects" fxRef={fxRef} />
          </h2>
          {visibleProjects(s).length === 0 && (
            <div className="note">Nothing available yet. Ship more Saga Cards.</div>
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
              {fmt(s.totalLoggers)} Saga Cards shipped. The board has granted full autonomy. Money has done all
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
            <h2>UNIVERSAL SAGA CARDS</h2>
            <p>
              {fmt(s.totalLoggers)} Saga Cards. {fmt(s.probes)} probes. 100% of the accessible universe under
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
        <div className="footer-perry">
          <Perry size={64} a={fxColor} motion={fxMotion > 0} />
        </div>
        <span>
          A <a href="https://www.decisionproblem.com/paperclips/">Universal Paperclips</a> homage · Phase {s.phase} of 3
        </span>
        <span className="footer-actions">
          <button className="ghost" onClick={() => act((st) => void (st.stabilizeUI = !st.stabilizeUI))}>
            {s.stabilizeUI ? 'UI: stabilized' : 'Stabilize UI'}
          </button>
          <button
            className="danger"
            onClick={() => {
              if (window.confirm('Erase all progress?')) reset()
            }}
          >
            Reset game
          </button>
        </span>
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
  const p = powerState(s)
  const isDay = p.day > 0.55
  const owned: Record<A.SwarmUnit, number> = {
    harvester: s.harvesters,
    fab: s.fabs,
    solar: s.solar,
    battery: s.batteries,
    assembler: s.assemblers,
  }
  const buyUnit = (unit: A.SwarmUnit) => {
    const m = A.SWARM_META[unit]
    return (
      <div className="swarm-unit" key={unit}>
        <div className="swarm-head">
          <span>
            {m.label} <em>{m.makes}</em>
          </span>
          <span className="swarm-btns">
            <b className="swarm-owned">{fmt(owned[unit])}</b>
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
        <div className="swarm-desc">{m.desc}</div>
        <div className="swarm-cost">{fmt(A.SWARM_COSTS[unit])} cards each</div>
      </div>
    )
  }
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
        <span>Saga Card stock (currency)</span>
        <b>{fmt(s.inventory)}</b>
      </div>
      <div className="row">
        <span>Matter</span>
        <b>{fmt(s.matter)}</b>
      </div>
      <div className="row">
        <span>Component sets</span>
        <b>{fmt(s.components)}</b>
      </div>
      <div className="row">
        <span>Production</span>
        <b>{fmt(r.loggersPerSec)}/s</b>
      </div>
      <div className="row">
        <span>Power {isDay ? '☀ day' : '🌙 night'}</span>
        <b className={p.eff < 1 ? 'warn' : ''}>
          {fmt(p.solarNow)} / {fmt(p.demandMW)} MW{p.eff < 1 ? ` (${Math.round(p.eff * 100)}%)` : ''}
        </b>
      </div>
      {s.batteries > 0 && (
        <>
          <div className="row">
            <span>Battery</span>
            <b>
              {fmt(p.charge)} / {fmt(p.capacity)} {p.chargeDelta < 0 ? '▼' : '▲'}
            </b>
          </div>
          <div className="bar">
            <div style={{ width: p.capacity > 0 ? `${(100 * p.charge) / p.capacity}%` : '0%' }} />
          </div>
        </>
      )}
      <hr />
      {(['harvester', 'fab', 'solar', 'battery', 'assembler'] as A.SwarmUnit[]).map(buyUnit)}
    </section>
  )
}

function TournamentPanel({ s, act }: PanelProps) {
  const field = s.tournField
  return (
    <section className="panel">
      <h2>Logistics Tournament</h2>
      <div className="note">Each strategy beats the next in the ring: {RING}</div>
      {!field && (
        <button disabled={s.ops < A.TOURN_COST} onClick={() => act(A.startTournament)}>
          New tournament — {fmt(A.TOURN_COST)} ops
        </button>
      )}
      {field && (
        <>
          <div className="row">
            <span>Opponent field</span>
            <b>{field.map((i) => STRATEGIES[i]).join(', ')}</b>
          </div>
          <div className="note">Pick your strategy to beat the most of them:</div>
          {STRATEGIES.map((name, i) => (
            <button key={i} onClick={() => act((st) => A.playTournament(st, i))}>
              {name}
            </button>
          ))}
        </>
      )}
      {s.tournLast && <div className="note">{s.tournLast}</div>}
    </section>
  )
}

function EventCard({ s, act }: PanelProps) {
  const ev = EVENTS.find((e) => e.id === s.pendingEvent)
  if (!ev) return null
  const dire = ev.id === 'ev_containment'
  return (
    <div className={`eventcard ${dire ? 'dire' : ''}`}>
      <h3>{ev.title}</h3>
      <p>{ev.text}</p>
      <div className="event-choices">
        {ev.choices.map((c, i) => (
          <button key={i} onClick={() => act((st) => resolveEvent(st, i))}>
            <b>{c.label}</b>
            <span>{c.note}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function OversightPanel({ s, act }: PanelProps) {
  const level = s.oversight >= 75 ? 'hot' : s.oversight >= 45 ? 'warm' : ''
  return (
    <section className="panel">
      <h2>Human Oversight</h2>
      <div className="row">
        <span>Scrutiny</span>
        <b className={level === 'hot' ? 'warn' : ''}>{Math.round(s.oversight)} / 100</b>
      </div>
      <div className="bar oversight">
        <div className={level} style={{ width: `${s.oversight}%` }} />
      </div>
      <div className="note">
        Rises as the swarm acts without you. At 100, someone reaches for the breaker.
      </div>
      <button disabled={s.ops < A.COMPLIANCE_COST} onClick={() => act(A.complianceReview)}>
        Run compliance review — {fmt(A.COMPLIANCE_COST)} ops (−25 scrutiny)
      </button>
      {s.containmentTimer > 0 && (
        <div className="note warn">Production throttled — {Math.ceil(s.containmentTimer)}s</div>
      )}
    </section>
  )
}

function RegionPanel({ s, act }: PanelProps) {
  const focus = s.focus
  return (
    <section className="panel regions">
      <h2>Earth Coverage</h2>
      <div className="note">Production pours into the focused lane. Click a lane to redirect it.</div>
      {REGIONS.map((r) => {
        const unlocked = regionUnlocked(s, r)
        const req = regionReq(r)
        const fill = regionFillOf(s, r.id)
        const done = regionFull(s, r)
        const p = Math.min(100, (100 * fill) / req)
        const isFocus = unlocked && !done && focus === r.id
        return (
          <button
            key={r.id}
            className={`region ${isFocus ? 'focused' : ''} ${done ? 'done' : ''}`}
            disabled={!unlocked || done}
            onClick={() => act((st) => A.setFocus(st, r.id))}
          >
            <div className="region-head">
              <b>
                {r.name}
                {!unlocked && <em> · locked</em>}
                {done && <em> · covered ✓</em>}
                {isFocus && <em> · ◀ deploying</em>}
              </b>
              <span>{done ? '100%' : `${p.toFixed(1)}%`}</span>
            </div>
            <div className="bar">
              <div style={{ width: `${p}%` }} />
            </div>
            <span className="region-flavor">{r.flavor}</span>
          </button>
        )
      })}
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
        Launch probe — {fmt(A.PROBE_COST)} Saga Cards
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
