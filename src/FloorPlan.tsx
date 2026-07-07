import { VIEW_W, VIEW_H, TABLE_RADIUS, TABLES, FEATURES } from './floorplanData'

type Props = {
  activeTable: string | null
}

export default function FloorPlan({ activeTable }: Props) {
  return (
    <svg
      className="floorplan"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="Venue floor plan"
    >
      {/* Decorative features: stage, dance floor, entrance */}
      {FEATURES.map((f) => (
        <g key={f.label} className="feature">
          <rect
            x={f.x}
            y={f.y}
            width={f.w}
            height={f.h}
            rx={f.rounded ? 10 : 4}
            className={f.dashed ? 'feature-box dashed' : 'feature-box'}
          />
          <text
            x={f.x + f.w / 2}
            y={f.y + f.h / 2}
            className="feature-label"
            dominantBaseline="central"
            textAnchor="middle"
          >
            {f.label}
          </text>
        </g>
      ))}

      {/* Tables */}
      {TABLES.map((t) => {
        const isActive = t.id === activeTable
        return (
          <g
            key={t.id}
            className={`table ${isActive ? 'table-active' : ''}`}
          >
            {isActive && (
              <circle
                cx={t.x}
                cy={t.y}
                r={TABLE_RADIUS}
                className="table-pulse"
              />
            )}
            <circle
              cx={t.x}
              cy={t.y}
              r={TABLE_RADIUS}
              className="table-circle"
            />
            <text
              x={t.x}
              y={t.y}
              className="table-label"
              dominantBaseline="central"
              textAnchor="middle"
            >
              {t.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
