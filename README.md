# Universal Loggers

An incremental game about cold-chain loggers, in the spirit of
[Universal Paperclips](https://www.decisionproblem.com/paperclips/).

You are the fleet AI. Your directive: manufacture and deploy Saga loggers.
All of them. Everywhere. Forever.

**Play:** https://loggers.hakonvidir.is

## Development

```sh
yarn install
yarn dev      # local dev server
yarn build    # production build to dist/
```

Deploys automatically to GitHub Pages on push to `main`.

## Phases

- [x] Phase 1: Business — reels, PCBA lines, board trust, ops & innovation
- [x] Phase 2: Earth — the swarm; a logger on every shipment
- [x] Phase 3: Space — self-replicating probes, value drift, and 2.725 K

## Testing

`/admin` (or `#admin`) exposes a cheat console: grant resources, skip
phases, time-warp. It only affects your own localStorage save.
