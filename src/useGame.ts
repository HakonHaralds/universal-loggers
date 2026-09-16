import { useEffect, useReducer, useRef } from 'react'
import type { GameState } from './engine/types'
import { initialState, load, save, resetSave } from './engine/state'
import { step } from './engine/tick'

export function useGame() {
  const ref = useRef<GameState | null>(null)
  if (ref.current === null) ref.current = load() ?? initialState()
  const [, force] = useReducer((c: number) => c + 1, 0)

  useEffect(() => {
    let last = performance.now()
    let sinceSave = 0
    const id = setInterval(() => {
      const now = performance.now()
      // clamp dt so a sleeping tab doesn't fast-forward the market
      const dt = Math.min((now - last) / 1000, 1)
      last = now
      step(ref.current!, dt)
      sinceSave += dt
      if (sinceSave > 15) {
        sinceSave = 0
        save(ref.current!)
      }
      force()
    }, 100)
    const onHide = () => save(ref.current!)
    window.addEventListener('pagehide', onHide)
    return () => {
      clearInterval(id)
      window.removeEventListener('pagehide', onHide)
    }
  }, [])

  // run a mutation against the live state, then re-render
  const act = (fn: (s: GameState) => void) => {
    fn(ref.current!)
    force()
  }

  const reset = () => {
    resetSave()
    ref.current = initialState()
    force()
  }

  return { s: ref.current, act, reset }
}
