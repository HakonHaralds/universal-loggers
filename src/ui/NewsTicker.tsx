import { useEffect, useRef, useState } from 'react'
import { pickIncident, tickerLabel } from '../engine/incidents'

export function NewsTicker({ phase }: { phase: number }) {
  const [txt, setTxt] = useState(() => pickIncident(phase))
  const [key, setKey] = useState(0)
  const ref = useRef(phase)
  ref.current = phase
  useEffect(() => {
    const id = setInterval(() => {
      setTxt(pickIncident(ref.current))
      setKey((k) => k + 1)
    }, 9000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="newsticker">
      <span className="nt-label">◉ {tickerLabel(phase)}</span>
      <span className="nt-text" key={key}>
        {txt}
      </span>
    </div>
  )
}
