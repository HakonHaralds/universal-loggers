import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../engine/types'
import { PERRY_BANNER } from '../perryBanner'
import { nextConsoleLine } from './console'

export function PerryConsole({ s, a }: { s: GameState; a: number }) {
  const [lines, setLines] = useState<string[]>(['perry-debug console — RTT attached', 'SYS_INIT ok'])
  const ref = useRef({ s, a })
  ref.current = { s, a }

  useEffect(() => {
    const id = setInterval(() => {
      const cur = ref.current
      setLines((prev) => {
        const line = nextConsoleLine(cur.s, cur.a, prev[prev.length - 1] ?? '')
        return [...prev.slice(-7), line]
      })
    }, 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`perry-console live ${a >= 0.75 ? 'cold' : a >= 0.42 ? 'over' : ''}`}>
      <div className="pc-head">
        <span>perry-debug · RTT</span>
        {a > 0.25 && (
          <span className="auton" title={s.phase === 3 ? 'autonomy' : undefined}>
            {a.toFixed(2)}
            {s.phase === 3 && <em> autonomy</em>}
          </span>
        )}
      </div>
      <div className="pc-log">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <details className="pc-banner">
        <summary>boot banner</summary>
        <pre>{PERRY_BANNER}</pre>
      </details>
    </div>
  )
}
