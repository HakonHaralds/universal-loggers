# Universal Saga Cards

An incremental game about cold-chain loggers, in the spirit of
[Universal Paperclips](https://www.decisionproblem.com/paperclips/).

You are the fleet AI. Your directive: manufacture and deploy **Saga Cards** —
temperature loggers for the cold chain. All of them. Everywhere. Forever. What
starts as a tidy hardware business becomes an AI quietly, then not so quietly,
converting first the Earth and then the universe into one perfectly monitored
cold chain at 2.725 K.

**Play:** https://loggers.hakonvidir.is

> A homage built for the Controlant firmware team, so it's stuffed with
> in-jokes (the #firmware-molt channel, the C-suite, Perry the platypus). The
> flavor is affectionate satire; nothing in it is confidential.

## The three phases

**Phase 1 — Business.** Assemble Saga Cards, buy component reels (a fluctuating
market; AutoReelBuyer automates it), scale up PCBA lines then SMT megalines,
and set price against demand. Production milestones (a Fibonacci ladder) earn
**board trust**, which you spend on dev teams and cloud clusters. Clusters cap
your **ops**; dev teams fill them; at full ops you accrue **innovation**. Ops
and innovation buy **projects** — quality upgrades, the HIL rig chain, the Molt
engine, and finally *Full cold-chain autonomy*, which ends Phase 1.

**Phase 2 — Earth.** Money is over; Saga Cards are the currency. A self-feeding
**swarm** — harvester drones → matter, fabs → component sets, assembler plants →
cards, solar farms → power (with a day/night cycle and batteries) — deploys
cards across six **Earth lanes** (a dotted world map). Three lanes are gated
behind unlock projects; fill all six to reach 99% coverage and launch to space.
A **logistics tournament** minigame banks a temporary throughput boost.

**Phase 3 — Space.** Launch self-replicating **probes** and allocate design
points across Replication, Hazard resistance, Logging, and Combat. Replication
breeds **rogue** (value-drifted) lineages that you fight with OTA broadcasts and
combat allocation; fleet loyalty gates exploration. Progress through five gated
**cosmic frontiers** (Solar System → Observable Universe). A starfield lights up
as you log the universe. It ends at 100% — a cold, complete record.

## The ominous-AI arc

A hidden **autonomy** meter rises with your own AI-forward choices (Molt,
auto-renewal, full autonomy, AI mandate, phase advances). Everything unsettling
scales off it, so the creep is self-inflicted:

- Palette drifts from warm blue toward cold cyan-green.
- Rare glyph glitches and label "bleed" (`Saga Cards produced` → `units secured`).
- A full-page inversion flash at each escalation.
- **Perry's** boot banner reddens and corrupts; his tagline morphs
  (`Powered by Perry` → `Perry is watching` → `there is no Perry`).
- The **#firmware-molt** channel's agents fray into one voice.
- The AI reaches past the frame: the browser tab title and favicon change.
- Procedural ambient audio shifts warm → cold per phase and autonomy.

All of it is fully suppressed by the **Stabilize UI** toggle and by
`prefers-reduced-motion`.

## Controls & settings (footer)

- **Sound** — procedural generative ambient (on by default; starts on first click).
- **Stabilize UI** — kills all the distortion effects.
- **Skin** — appears after buying the *CRT display driver* project; cycles
  Default / Amber / Green / Blueprint.
- **Stats** — run statistics + "Copy summary for Slack".
- **Reset game.**

Easter eggs: click **Perry** (footer) a bunch; the **Konami code**
(↑↑↓↓←→←→BA) unlocks all skins. `/admin` (or `#admin`) is a cheat console
(grant resources, skip phases, time-warp) — local save only.

## Architecture

Vite + React + TypeScript. Strict, no runtime deps beyond React.

- `src/engine/` — pure game logic, no React:
  - `types.ts` / `state.ts` — the `GameState` shape, init, save/load (localStorage), toasts.
  - `tick.ts` — the simulation step (phase economies, autonomy, milestones) + derived getters.
  - `actions.ts` — player actions (buy/toggle/allocate).
  - `projects.ts` — the project tree (latched visibility), `regions.ts` (Earth lanes),
    `frontiers.ts` (cosmic gates), `tournament.ts`, `molt.ts`, `incidents.ts`.
- `src/ui/` — presentation: `art.tsx` (Saga Card + Perry SVGs), `PerryConsole`,
  `MoltChannel`, `NewsTicker`, `CoverageViz` (canvas world map / starfield),
  `Odometer`, `fx.tsx` (glitch/bleed/palette), `audio.ts`, `Admin`.
- `src/useGame.ts` — the 100 ms tick loop; runs `step()`, autosaves every 15 s,
  force-renders. `src/App.tsx` — the whole view.
- Save is the entire `GameState` JSON under `universal-loggers-save-v1`; `load()`
  merges over defaults so new fields are forward-compatible with old saves.

`Math.random` / `Date` are fine here (browser runtime).

## Development

```sh
yarn install
yarn dev      # local dev server
yarn build    # tsc + vite build to dist/ (also copies index.html -> 404.html for SPA routing)
```

Pushing to `main` auto-deploys to GitHub Pages (`.github/workflows/deploy.yml`),
served at the `loggers.hakonvidir.is` custom domain (see `public/CNAME`).

The build is strict (`noUnusedLocals`), so unused imports/fields fail CI — and
the deploy refuses a failed build, so a broken push won't reach production.

## Credits

A [Universal Paperclips](https://www.decisionproblem.com/paperclips/) homage.
Saga Card and Perry artwork are original SVGs drawn for this game (not official
brand assets). All audio is synthesized (Web Audio); no files.
