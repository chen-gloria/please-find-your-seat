import { VIEW_W, VIEW_H, FEATURES, placeTables, type Layout } from './layout'

type Props = {
  layout: Layout
  activeTable: string | null
}

export default function FloorPlan({ layout, activeTable }: Props) {
  const tables = placeTables(layout)

  return (
    <svg
      className="floorplan"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="Venue floor plan"
    >
      {/* Room walls */}
      <rect
        className="room"
        x="12"
        y="12"
        width={VIEW_W - 24}
        height={VIEW_H - 24}
        rx="6"
      />

      {/* Fixed features: front wall, dance floor, door, bar… */}
      {FEATURES.map((f) => (
        <g key={f.key}>
          <rect
            x={f.x}
            y={f.y}
            width={f.w}
            height={f.h}
            rx={f.variant === 'floor' ? 4 : 6}
            className={`feat feat-${f.variant}`}
          />
          {f.label && (
            <text
              x={f.x + f.w / 2}
              y={f.y + f.h / 2}
              className={`feat-label feat-label-${f.variant}`}
              dominantBaseline="central"
              textAnchor="middle"
              transform={
                f.vertical
                  ? `rotate(90 ${f.x + f.w / 2} ${f.y + f.h / 2})`
                  : undefined
              }
            >
              {f.label}
            </text>
          )}
        </g>
      ))}

      {/* Tables (generated from the row config) */}
      {tables.map((t) => {
        const isActive = activeTable != null && t.id === activeTable
        return (
          <g key={t.id + '@' + t.x} className={isActive ? 'table-active' : ''}>
            {isActive && (
              <circle cx={t.x} cy={t.y} r={t.r} className="table-pulse" />
            )}
            <circle cx={t.x} cy={t.y} r={t.r} className="table-circle" />
            {/* small seat marker on the FRONT (top) side — shows facing */}
            <rect
              x={t.x - 7}
              y={t.y - t.r - 4}
              width="14"
              height="7"
              rx="3"
              className="seat-marker"
            />
            <text
              x={t.x}
              y={t.y}
              className="table-label"
              dominantBaseline="central"
              textAnchor="middle"
              style={{ fontSize: Math.max(16, t.r * 0.7) }}
            >
              {t.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
