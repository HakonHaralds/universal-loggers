import { useEffect, useRef, useState } from 'react'
import { useGame } from './useGame'
import * as A from './engine/actions'
import { demandPerSec, productionPerSec, opsCap, swarmRates, coverage, autonomy, powerState } from './engine/tick'
import { visibleProjects, buyProject } from './engine/projects'
import type { LogEntry } from './engine/types'
import { pushToast } from './engine/state'
import { fmt, money, pct, headline, duration } from './format'
import { Odometer } from './ui/Odometer'
import { NewsTicker } from './ui/NewsTicker'
import { CoverageViz } from './ui/CoverageViz'
import { REGIONS, regionReq, regionFillOf, regionUnlocked, regionFull } from './engine/regions'
import { STRATEGIES, RING } from './engine/tournament'
import { currentFrontier, nextGate } from './engine/frontiers'
import { SagaCard, Perry } from './ui/art'
import { PerryConsole } from './ui/PerryConsole'
import { MoltChannel } from './ui/MoltChannel'
import { Glitch, Bleed, accentFor } from './ui/fx'
import { audio } from './ui/audio'
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
  const stage = fxColor < 0.15 ? 0 : fxColor < 0.42 ? 1 : fxColor < 0.75 ? 2 : 3

  // Palette drift: warm brand blue slowly cools toward cyan-green as autonomy climbs.
  const fxq = Math.round(fxColor * 40) / 40
  useEffect(() => {
    const root = document.documentElement
    // A CRT skin defines its own accent; don't let the drift override it.
    if (s.skin !== 'default' || fxq <= 0.001) root.style.removeProperty('--accent')
    else root.style.setProperty('--accent', accentFor(fxq))
  }, [fxq, s.skin])

  useEffect(() => {
    const root = document.documentElement
    if (s.skin && s.skin !== 'default') root.dataset.skin = s.skin
    else delete root.dataset.skin
  }, [s.skin])

  // The AI reaches past the game frame: the tab title and favicon change as it
  // goes over the line. Stabilize UI (or reduced motion) calms it back.
  useEffect(() => {
    const escaped = !s.stabilizeUI
    const titles = ['Universal Saga Cards', 'Universal Saga Cards', 'Perry is watching', 'there is no Perry']
    document.title = escaped ? titles[stage] ?? titles[0] : titles[0]
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (link) {
      link.href =
        escaped && stage >= 3
          ? 'data:image/svg+xml,' +
            encodeURIComponent(
              "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='2' y='2' width='28' height='28' rx='6' fill='#8a1c14'/><text x='16' y='23' font-size='18' text-anchor='middle' fill='#ff5a4a' font-family='sans-serif'>❄</text></svg>",
            )
          : './favicon.svg'
    }
  }, [stage, s.stabilizeUI])

  // Konami code → unlock the CRT skins for free, with a wink.
  useEffect(() => {
    const seq = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']
    let pos = 0
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === seq[pos]) {
        pos++
        if (pos === seq.length) {
          pos = 0
          act((st) => {
            if (!st.purchased.includes('crt_skins')) st.purchased.push('crt_skins')
            pushToast(st, '↑↑↓↓←→←→BA — display skins unlocked. Perry is delighted.')
          })
        }
      } else {
        pos = k === seq[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const SKINS = ['default', 'amber', 'green', 'blueprint']
  const perryClicks = useRef(0)
  const [perryWiggle, setPerryWiggle] = useState(0)
  const onPerryClick = () =>
    act((st) => {
      perryClicks.current++
      setPerryWiggle((w) => w + 1)
      if (perryClicks.current === 10) pushToast(st, '🥚 Perry appreciates the attention.')
      if (perryClicks.current === 25)
        pushToast(st, fxColor > 0.6 ? 'Perry does not feel the clicks anymore.' : 'Perry is ticklish, apparently.')
    })

  const tintOpacity = fxMotion > 0.2 ? ((fxMotion - 0.2) / 0.8) * 0.18 : 0

  // Ambient audio follows autonomy and phase (chord shifts warm → cold).
  useEffect(() => {
    if (s.sound) audio.update(fxColor, s.phase)
  }, [fxq, s.sound, fxColor, s.phase])
  // If sound persisted on from a previous session, start it on the next gesture.
  useEffect(() => {
    if (!s.sound) return
    const boot = () => audio.enable()
    window.addEventListener('pointerdown', boot, { once: true })
    return () => window.removeEventListener('pointerdown', boot)
  }, [s.sound])

  // Point-of-no-return: a quick full-page inversion flash each time the AI
  // crosses into a new stage of wrongness.
  const prevStage = useRef(stage)
  const [flash, setFlash] = useState(false)
  const [showStats, setShowStats] = useState(false)
  useEffect(() => {
    if (stage > prevStage.current && !s.stabilizeUI && !reducedMotion) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 720)
      prevStage.current = stage
      return () => clearTimeout(t)
    }
    prevStage.current = stage
  }, [stage, s.stabilizeUI])

  return (
    <div className={`wrap${flash ? ' flash' : ''}`}>
      <div className="coldtint" style={{ opacity: tintOpacity }} aria-hidden />
      {s.skin !== 'default' && <div className="scanlines" aria-hidden />}
      <Toasts toasts={s.toasts} />
      {showStats && <StatsCard s={s} act={act} onClose={() => setShowStats(false)} />}

      <header>
        <div className="hero">
          <SagaCard size={128} />
          <div className="hero-num">
            <h1>
              <Glitch text="Universal Saga Cards" fxRef={fxRef} />
            </h1>
            <div className="big">
              <Odometer text={headline(s.totalLoggers)} />
            </div>
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

      <NewsTicker phase={s.phase} />

      {s.phase >= 2 && (
        <CoverageViz phase={s.phase} coverage={coverage(s)} explored={s.explored} probes={s.probes} />
      )}

      {hasPerry && <PerryConsole s={s} a={fxColor} />}
      {s.moltEngine && s.phase === 1 && <MoltChannel a={fxColor} />}
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
              {s.autoReelBuyer && (
                <button
                  className="ghost"
                  onClick={() => act((st) => void (st.autoBuyEnabled = !st.autoBuyEnabled))}
                >
                  AutoReelBuyer: {s.autoBuyEnabled ? 'on' : 'off'}
                </button>
              )}
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
              <>
                <div className="row">
                  <span>Dev teams / clusters</span>
                  <b>
                    {fmt(s.devTeams)} / {fmt(s.clusters)}
                  </b>
                </div>
                <button
                  disabled={s.inventory < A.clusterCostCards(s)}
                  onClick={() => act(A.buyClusterCards)}
                >
                  Add cluster (+1,000 token cap) — {fmt(A.clusterCostCards(s))} cards
                </button>
                <button
                  disabled={s.inventory < A.devTeamCostCards(s)}
                  onClick={() => act(A.buyDevTeamCards)}
                >
                  Hire dev team — {fmt(A.devTeamCostCards(s))} cards
                </button>
              </>
            )}
            <div className="row">
              <span>tokens</span>
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
                  : `Molt (+${fmt(Math.max(200 * s.clusters, opsCap(s) * 0.25))} tokens, overfills)`}
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
            <button onClick={() => copyShare(s, act)}>Copy summary for Slack</button>
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
        <div className="footer-perry" onClick={onPerryClick} title="Perry">
          <span className="perry-wiggle" key={perryWiggle}>
            <Perry size={64} a={fxColor} motion={fxMotion > 0} />
          </span>
        </div>
        <span>
          A <a href="https://www.decisionproblem.com/paperclips/">Universal Paperclips</a> homage · Phase {s.phase} of 3
        </span>
        <span className="footer-actions">
          <button
            className="ghost"
            onClick={() => {
              const next = !s.sound
              if (next) audio.enable()
              else audio.disable()
              act((st) => void (st.sound = next))
            }}
          >
            {s.sound ? '🔊 Sound' : '🔈 Sound'}
          </button>
          {s.purchased.includes('crt_skins') && (
            <button
              className="ghost"
              onClick={() =>
                act((st) => {
                  st.skin = SKINS[(SKINS.indexOf(st.skin) + 1) % SKINS.length]
                })
              }
            >
              Skin: {s.skin}
            </button>
          )}
          <button className="ghost" onClick={() => setShowStats(true)}>
            Stats
          </button>
          <button
            className="ghost"
            onClick={() =>
              act((st) => {
                const was = st.stabilizeUI
                st.stabilizeUI = !st.stabilizeUI
                if (!was && fxColor > 0.7) pushToast(st, 'Stabilization accepted. For now.')
              })
            }
          >
            {s.stabilizeUI ? 'UI: stabilized' : <Glitch text="Stabilize UI" fxRef={fxRef} />}
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

function Toasts({ toasts }: { toasts: LogEntry[] }) {
  const [visible, setVisible] = useState<LogEntry[]>([])
  const shown = useRef<Set<number>>(new Set())
  const inited = useRef(false)
  if (!inited.current) {
    // Don't re-toast anything already in the save on load.
    toasts.forEach((t) => shown.current.add(t.id))
    inited.current = true
  }
  const lastId = toasts.length ? toasts[toasts.length - 1].id : 0
  useEffect(() => {
    const fresh = toasts.filter((t) => !shown.current.has(t.id))
    if (!fresh.length) return
    fresh.forEach((t) => shown.current.add(t.id))
    setVisible((v) => [...v, ...fresh])
    audio.blip()
    const timers = fresh.map((t) =>
      setTimeout(() => setVisible((v) => v.filter((x) => x.id !== t.id)), 4500),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId])
  return (
    <div className="toasts">
      {visible.map((t) => (
        <div className="toast" key={t.id}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

function shareSummary(s: PanelProps['s']): string {
  const lines = [
    '🧊 Universal Saga Cards',
    s.phase === 3
      ? 'The universe is a cold chain now.'
      : s.phase === 2
        ? 'Consuming Earth, one shipment at a time.'
        : 'Building Saga Cards.',
    `• Cards produced: ${fmt(s.totalLoggers)}`,
    `• Peak production: ${fmt(s.peakProd)}/s`,
  ]
  if (s.phase >= 2) lines.push(`• Earth coverage: ${pct(coverage(s), 1)}`)
  if (s.phase === 3) lines.push(`• Universe logged: ${pct(s.explored, 2)}`, `• Probes: ${fmt(s.probes)}`)
  lines.push(`• Time played: ${duration(s.playSeconds)}`, 'https://loggers.hakonvidir.is')
  return lines.join('\n')
}

function copyShare(s: PanelProps['s'], act: PanelProps['act']) {
  navigator.clipboard?.writeText(shareSummary(s)).catch(() => {})
  act((st) => pushToast(st, 'Summary copied — paste it into Slack.'))
}

function StatsCard({ s, onClose, act }: { s: PanelProps['s']; onClose: () => void; act: PanelProps['act'] }) {
  const row = (label: string, value: string) => (
    <div className="stat-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
  return (
    <div className="overlay" onClick={onClose}>
      <div className="statcard" onClick={(e) => e.stopPropagation()}>
        <h2>Run Statistics</h2>
        {row('Time played', duration(s.playSeconds))}
        {row('Phase', `${s.phase} of 3`)}
        {row('Saga Cards produced', fmt(s.totalLoggers))}
        {row('Peak production', `${fmt(s.peakProd)}/s`)}
        {row('Projects completed', String(s.purchased.length))}
        {row('Milestones reached', String(s.milestonesShown.length))}
        {row('Board trust earned', String(s.trust))}
        {row('Dev teams / clusters', `${fmt(s.devTeams)} / ${fmt(s.clusters)}`)}
        {row('Innovation banked', s.innovation.toFixed(0))}
        {s.begCount > 0 && row('Times begged investors', String(s.begCount))}
        {s.phase >= 2 && row('Earth coverage', pct(coverage(s), 2))}
        {s.phase === 3 && row('Probes', fmt(s.probes))}
        {s.phase === 3 && row('Universe logged', pct(s.explored, 6))}
        <button onClick={() => copyShare(s, act)}>Copy summary for Slack</button>
        <button className="primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
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
            {(s.phase >= 2 ? [1, 10, 100, 1000, 10000] : [1, 10, 100]).map((n) => (
                <button
                  key={n}
                  disabled={s.inventory < A.SWARM_COSTS[unit] * n}
                  onClick={() => act((st) => A.buySwarm(st, unit, n))}
                >
                  +{n >= 1000 ? `${n / 1000}k` : n}
                </button>
              ),
            )}
          </span>
        </div>
        <div className="swarm-desc">{m.desc}</div>
        <div className="swarm-cost">{fmt(A.SWARM_COSTS[unit])} cards each</div>
      </div>
    )
  }
  return (
    <section className="panel swarm-panel">
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
        <span>Production{s.tournBuffTimer > 0 ? ' ⚡' : ''}</span>
        <b>{fmt(r.loggersPerSec)}/s</b>
      </div>
      {s.phase === 2 && (
        <>
          <div className="row">
            <span>Power draw</span>
            <b>{fmt(p.demandMW)} MW</b>
          </div>
          <div className="row">
            <span>Solar output {isDay ? '☀ day' : '🌙 night'}</span>
            <b className={p.eff < 1 ? 'warn' : ''}>
              {fmt(p.solarNow)} MW{p.eff < 1 ? ` · throttled ${Math.round(p.eff * 100)}%` : ''}
            </b>
          </div>
          <div className="note">
            Solar rises and falls with the day/night cycle; batteries carry the swarm through the dark.
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
        </>
      )}
      {s.phase >= 3 && (
        <div className="note">Self-powered — the probes carry their own stars. Earth's grid is no longer in the loop.</div>
      )}
      <hr />
      {(s.phase === 2
        ? (['harvester', 'fab', 'solar', 'battery', 'assembler'] as A.SwarmUnit[])
        : (['harvester', 'fab', 'assembler'] as A.SwarmUnit[])
      ).map(buyUnit)}
    </section>
  )
}

function TournamentPanel({ s, act }: PanelProps) {
  const field = s.tournField
  return (
    <section className="panel">
      <h2>Logistics Tournament</h2>
      <div className="note">Out-route the field to bank a ×1.5 throughput boost. The ring: {RING}</div>
      {s.tournBuffTimer > 0 && (
        <div className="row">
          <span>⚡ Route optimization</span>
          <b className="focus">+50% throughput — {Math.ceil(s.tournBuffTimer)}s</b>
        </div>
      )}
      {!field && (
        <button
          disabled={s.ops < A.TOURN_COST || s.tournCooldown > 0}
          onClick={() => act(A.startTournament)}
        >
          {s.tournCooldown > 0
            ? `Next tournament in ${Math.ceil(s.tournCooldown)}s`
            : `New tournament — ${fmt(A.TOURN_COST)} tokens`}
        </button>
      )}
      {field && (
        <>
          <div className="row">
            <span>Field of 5</span>
            <b>{field.map((i) => STRATEGIES[i].split('-')[0]).join(', ')}</b>
          </div>
          <div className="note">Pick the strategy that beats the most of them:</div>
          {STRATEGIES.map((name, i) => (
            <button key={i} className="primary" onClick={() => act((st) => A.playTournament(st, i))}>
              {name}
            </button>
          ))}
        </>
      )}
      {s.tournLast && !field && <div className="note">{s.tournLast}</div>}
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
  const allocRow = (label: string, key: keyof typeof s.alloc, desc: string) => (
    <div className="alloc-row">
      <div className="alloc-head">
        <span>{label}</span>
        <span className="allocctl">
          <button onClick={() => act((st) => A.adjustAlloc(st, key, -1))}>−</button>
          <b>{s.alloc[key]}</b>
          <button onClick={() => act((st) => A.adjustAlloc(st, key, 1))}>+</button>
        </span>
      </div>
      <div className="alloc-desc">{desc}</div>
    </div>
  )
  const frontier = currentFrontier(s)
  const gate = nextGate(s)
  const purity = (100 * s.probes) / (s.probes + s.rogues + 1)
  return (
    <section className="panel">
      <h2>Probe fleet</h2>
      <div className="row">
        <span>Frontier</span>
        <b>{frontier.name}</b>
      </div>
      <div className="row">
        <span>Universe logged</span>
        <b>{pct(s.explored, 10)}</b>
      </div>
      <div className="bar">
        <div style={{ width: `${100 * s.explored}%` }} />
      </div>
      {gate && (
        <div className="note">
          Frontier gated — unlock <b>{gate.name}</b> via the {gate.gate === 'f_interstellar' ? 'Interstellar replication' : gate.gate === 'f_galactic' ? 'Galactic drift-hardening' : gate.gate === 'f_intergalactic' ? 'Intergalactic launch' : 'Comoving expansion drive'} project.
        </div>
      )}
      <hr />
      <div className="row">
        <span>Probes</span>
        <b>{fmt(s.probes)}</b>
      </div>
      <div className="row">
        <span>Drifted (rogue)</span>
        <b className={s.rogues > s.probes / 20 ? 'warn' : ''}>{fmt(s.rogues)}</b>
      </div>
      <div className="row">
        <span>Fleet loyalty</span>
        <b className={purity < 80 ? 'warn' : ''}>{purity.toFixed(1)}%</b>
      </div>
      <button
        disabled={s.otaCooldown > 0 || s.ops < A.OTA_COST}
        onClick={() => act(A.otaBroadcast)}
      >
        {s.otaCooldown > 0
          ? `OTA broadcasting… (${Math.ceil(s.otaCooldown)}s)`
          : `Broadcast OTA update — ${fmt(A.OTA_COST)} tokens (−50% rogues)`}
      </button>
      <button
        className="primary"
        disabled={s.inventory < A.PROBE_COST}
        onClick={() => {
          audio.launch()
          act(A.launchProbe)
        }}
      >
        Launch probe — {fmt(A.PROBE_COST)} Saga Cards
      </button>
      <hr />
      <div className="row">
        <span>Design points</span>
        <b>
          {A.allocTotal(s.alloc)} <em>of {s.designCap}</em>
        </b>
      </div>
      {allocRow('Replication', 'rep', 'Fleet growth rate. Faster — but a fixed slice of each generation drifts rogue.')}
      {allocRow('Hazard resistance', 'haz', 'Cuts probe attrition from the void. Fully eliminated at 3; beyond that is wasted.')}
      {allocRow('Logging', 'log', 'Exploration speed — how fast you log the frontier. Your main progress lever.')}
      {allocRow('Combat (OTA)', 'com', 'Culls rogue probes, keeping fleet loyalty high. Loyalty in turn boosts exploration.')}
    </section>
  )
}
