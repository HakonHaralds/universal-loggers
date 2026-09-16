import { useEffect, useRef, useState } from 'react'

// An original illustration of a Saga Card — a cold-chain temperature logger.
// Not an official brand asset; a stylized device drawn for this fan game.
export function SagaCard({ size = 132 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 140) / 220} viewBox="0 0 220 140" role="img" aria-label="Saga Card">
      <defs>
        <linearGradient id="sc-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14243f" />
          <stop offset="1" stopColor="#0d1a30" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="216" height="136" rx="16" fill="url(#sc-body)" stroke="#31538a" strokeWidth="1.5" />
      <rect x="18" y="20" width="128" height="68" rx="6" fill="#e7efe0" />
      <text x="28" y="52" fontFamily="ui-monospace, monospace" fontSize="26" fontWeight="700" fill="#16351f">
        −20.4
      </text>
      <text x="120" y="40" fontFamily="ui-monospace, monospace" fontSize="13" fill="#16351f">
        °C
      </text>
      <polyline
        points="26,78 44,72 60,74 76,66 92,69 108,60 126,63 138,58"
        fill="none"
        stroke="#3f7a4e"
        strokeWidth="2"
      />
      <circle cx="163" cy="26" r="5" fill="#4bd07a" />
      <text x="174" y="30" fontFamily="system-ui, sans-serif" fontSize="10" fill="#9fc0ef">
        REC
      </text>
      <g stroke="#7fb3ff" strokeWidth="2" strokeLinecap="round">
        <line x1="185" y1="46" x2="185" y2="72" />
        <line x1="174" y1="52" x2="196" y2="66" />
        <line x1="196" y1="52" x2="174" y2="66" />
      </g>
      <text x="18" y="108" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="800" fill="#ffffff" letterSpacing="3">
        SAGA
      </text>
      <text x="20" y="124" fontFamily="system-ui, sans-serif" fontSize="8.5" fill="#7f9dc4" letterSpacing="2">
        COLD CHAIN LOGGER
      </text>
      <g fill="#c9a84a">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={150 + i * 12} y={100} width="8" height="22" rx="1.5" />
        ))}
      </g>
    </svg>
  )
}

// An original cute platypus mascot — the firmware team's "Perry".
// It is the warmest thing on screen, and the last the corruption reaches:
// its eye tracks the cursor as autonomy rises, then a cold tint creeps in.
export function Perry({ size = 96, a = 0, motion = true }: { size?: number; a?: number; motion?: boolean }) {
  const wrapRef = useRef<SVGSVGElement>(null)
  const [pupil, setPupil] = useState({ x: 0, y: 0 })

  const watching = motion && a > 0.2
  useEffect(() => {
    if (!watching) {
      setPupil({ x: 0, y: 0 })
      return
    }
    const onMove = (e: MouseEvent) => {
      const el = wrapRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width * 0.78
      const cy = r.top + r.height * 0.35
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const d = Math.hypot(dx, dy) || 1
      const reach = 3.2
      setPupil({ x: (dx / d) * reach, y: (dy / d) * reach })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [watching])

  // Body teal cools toward the cold accent as autonomy passes ~0.6 (last to fall).
  const cool = Math.max(0, Math.min(1, (a - 0.6) / 0.4))
  const body = mix([26, 166, 166], [20, 200, 168], cool)
  const constrict = a > 0.85 ? 3.2 : 4.5

  return (
    <svg
      ref={wrapRef}
      width={size}
      height={(size * 150) / 200}
      viewBox="0 0 200 150"
      role="img"
      aria-label="Perry the platypus"
    >
      <ellipse cx="34" cy="96" rx="30" ry="20" fill="#6f4a2d" transform="rotate(-18 34 96)" />
      <ellipse cx="108" cy="92" rx="72" ry="42" fill={body} />
      <circle cx="158" cy="66" r="34" fill={body} />
      <ellipse cx="192" cy="74" rx="26" ry="13" fill="#e88a3c" />
      <ellipse cx="192" cy="74" rx="26" ry="13" fill="none" stroke="#c9722c" strokeWidth="1.5" />
      <line x1="170" y1="74" x2="214" y2="74" stroke="#c9722c" strokeWidth="1.2" />
      <circle cx="156" cy="52" r="9" fill={a > 0.85 ? '#dfe6e6' : '#fff'} />
      <circle cx={159 + pupil.x} cy={53 + pupil.y} r={constrict} fill="#12262b" />
      <ellipse cx="92" cy="132" rx="13" ry="7" fill="#e88a3c" />
      <ellipse cx="130" cy="134" rx="13" ry="7" fill="#e88a3c" />
    </svg>
  )
}

function mix(from: number[], to: number[], t: number): string {
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}
