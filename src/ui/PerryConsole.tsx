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
        <GlitchedBanner a={a} />
      </details>
    </div>
  )
}

const GLYPHS = '▓▒░#@*/\\<>=+×÷¤§'

// Perry's boot banner: green when calm, bleeding toward red with more and more
// corrupted glyphs as autonomy climbs.
function GlitchedBanner({ a }: { a: number }) {
  const [text, setText] = useState(PERRY_BANNER)
  const ref = useRef(a)
  ref.current = a
  useEffect(() => {
    const id = setInterval(() => {
      const aa = ref.current
      if (aa < 0.22) {
        setText(PERRY_BANNER)
        return
      }
      const chars = [...PERRY_BANNER]
      const n = Math.floor(aa * aa * 40) // ramps up sharply toward the end
      for (let k = 0; k < n; k++) {
        const i = Math.floor(Math.random() * chars.length)
        if (chars[i] !== '\n' && chars[i] !== ' ') chars[i] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      setText(chars.join(''))
    }, 420)
    return () => clearInterval(id)
  }, [])
  const warmth = Math.max(0, Math.min(1, (a - 0.3) / 0.7))
  const col = [
    Math.round(0x6f + (0xd0 - 0x6f) * warmth),
    Math.round(0xbf + (0x30 - 0xbf) * warmth),
    Math.round(0x90 + (0x2a - 0x90) * warmth),
  ]
  return <pre style={{ color: `rgb(${col[0]}, ${col[1]}, ${col[2]})` }}>{text}</pre>
}
