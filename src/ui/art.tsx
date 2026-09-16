import { PERRY_BANNER } from '../perryBanner'

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
      {/* e-ink display */}
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
      {/* status + wordmark */}
      <circle cx="163" cy="26" r="5" fill="#4bd07a" />
      <text x="174" y="30" fontFamily="system-ui, sans-serif" fontSize="10" fill="#9fc0ef">
        REC
      </text>
      {/* snowflake */}
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
      {/* contacts */}
      <g fill="#c9a84a">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={150 + i * 12} y={100} width="8" height="22" rx="1.5" />
        ))}
      </g>
    </svg>
  )
}

// An original cute platypus mascot — the firmware team's "Perry".
export function Perry({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 150) / 200} viewBox="0 0 200 150" role="img" aria-label="Perry the platypus">
      {/* tail */}
      <ellipse cx="34" cy="96" rx="30" ry="20" fill="#6f4a2d" transform="rotate(-18 34 96)" />
      {/* body */}
      <ellipse cx="108" cy="92" rx="72" ry="42" fill="#1aa6a6" />
      {/* head */}
      <circle cx="158" cy="66" r="34" fill="#1aa6a6" />
      {/* bill */}
      <ellipse cx="192" cy="74" rx="26" ry="13" fill="#e88a3c" />
      <ellipse cx="192" cy="74" rx="26" ry="13" fill="none" stroke="#c9722c" strokeWidth="1.5" />
      <line x1="170" y1="74" x2="214" y2="74" stroke="#c9722c" strokeWidth="1.2" />
      {/* eye */}
      <circle cx="156" cy="52" r="9" fill="#fff" />
      <circle cx="159" cy="53" r="4.5" fill="#12262b" />
      {/* feet */}
      <ellipse cx="92" cy="132" rx="13" ry="7" fill="#e88a3c" />
      <ellipse cx="130" cy="134" rx="13" ry="7" fill="#e88a3c" />
    </svg>
  )
}

// The original 40-line RTT boot banner from perry-debug, as an easter egg.
export function PerryBanner() {
  return (
    <details className="perry-console">
      <summary>perry-debug console</summary>
      <pre>{PERRY_BANNER}</pre>
    </details>
  )
}
