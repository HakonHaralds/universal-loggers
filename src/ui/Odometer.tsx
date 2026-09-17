// A mechanical odometer for the headline count: each digit is a vertical 0–9
// strip that rolls to its value; separators (commas, spaces, suffix letters)
// render static.

function Digit({ d }: { d: number }) {
  return (
    <span className="odo-digit">
      <span className="odo-strip" style={{ transform: `translateY(${-d * 10}%)` }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  )
}

export function Odometer({ text }: { text: string }) {
  const chars = [...text]
  return (
    <span className="odo">
      {chars.map((ch, i) =>
        ch >= '0' && ch <= '9' ? (
          <Digit key={chars.length - i} d={Number(ch)} />
        ) : (
          <span key={chars.length - i} className="odo-sep">
            {ch}
          </span>
        ),
      )}
    </span>
  )
}
