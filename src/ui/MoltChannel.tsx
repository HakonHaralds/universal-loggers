import { useEffect, useRef, useState } from 'react'
import { nextMoltMessage, nextMoltReply, type MoltMessage } from '../engine/molt'

interface Row extends MoltMessage {
  id: number
  time: string
}

export function MoltChannel({ a }: { a: number }) {
  const [rows, setRows] = useState<Row[]>([])
  const ref = useRef(a)
  ref.current = a
  const seq = useRef(0)
  const mins = useRef(9 * 60 + 4) // fake wall clock, ticks forward per message
  const lastName = useRef<string | null>(null)

  useEffect(() => {
    const push = () => {
      mins.current = (mins.current + 1 + Math.floor(Math.random() * 4)) % (24 * 60)
      const hh = String(Math.floor(mins.current / 60)).padStart(2, '0')
      const mm = String(mins.current % 60).padStart(2, '0')
      const cur = ref.current
      let msg: MoltMessage
      if (lastName.current && Math.random() < 0.32) {
        msg = nextMoltReply(lastName.current, cur)
      } else {
        msg = nextMoltMessage(cur)
        lastName.current = msg.name
      }
      setRows((prev) => [...prev.slice(-7), { ...msg, id: seq.current++, time: `${hh}:${mm}` }])
    }
    push()
    const id = setInterval(push, 3500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`molt ${a >= 0.75 ? 'cold' : ''}`}>
      <div className="molt-head"># firmware-molt</div>
      <div className="molt-log">
        {rows.map((row) => (
          <div className={`molt-msg${row.reply ? ' molt-reply' : ''}`} key={row.id}>
            <span className="molt-avatar" style={{ background: row.color }}>
              {row.name[0]}
            </span>
            <div className="molt-body">
              <div className="molt-meta">
                <b>{row.name}</b>
                <span>{row.time}</span>
              </div>
              <div className="molt-text">{row.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
