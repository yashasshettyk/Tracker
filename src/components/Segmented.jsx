/** Sliding-thumb segmented control. `items` = [{ k, label }] */
export default function Segmented({ items, value, onChange, tone = '' }) {
  const n = items.length
  const idx = Math.max(items.findIndex((i) => i.k === value), 0)
  return (
    <div className="seg">
      <div
        className={'seg-thumb ' + tone}
        style={{
          width: `calc((100% - ${8 + 2 * (n - 1)}px) / ${n})`,
          transform: `translateX(calc(${idx} * (100% + 2px)))`,
        }}
      />
      {items.map((it) => (
        <button
          key={it.k} type="button"
          className={
            'seg-btn' +
            (value === it.k ? ' on' : '') +
            // tinted thumbs are light, so their active label needs dark ink
            (tone && value === it.k ? ' ink' : '') +
            (tone === 'casual' && value === it.k ? ' warm' : '')
          }
          onClick={() => onChange(it.k)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
