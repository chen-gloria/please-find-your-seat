// ─────────────────────────────────────────────────────────────
//  FLOOR PLAN LAYOUT
//  Edit the coordinates / labels here to match your real venue.
//  `id` must match the "table" value in public/guests.json.
//  The SVG canvas is VIEW_W x VIEW_H units — positions are in those units.
// ─────────────────────────────────────────────────────────────

export const VIEW_W = 420
export const VIEW_H = 560
export const TABLE_RADIUS = 34

export type Table = {
  id: string // matches guest.table
  label: string // text shown inside the circle
  x: number
  y: number
}

// Non-interactive decorations (stage, dance floor, entrance…).
export type Feature = {
  label: string
  x: number
  y: number
  w: number
  h: number
  rounded?: boolean
  dashed?: boolean
}

export const FEATURES: Feature[] = [
  { label: 'Stage', x: 110, y: 28, w: 200, h: 50, rounded: true },
  { label: 'Dance Floor', x: 150, y: 205, w: 120, h: 160, dashed: true },
  { label: 'Entrance', x: 150, y: 505, w: 120, h: 34, rounded: true },
]

export const TABLES: Table[] = [
  { id: '1', label: '1', x: 90, y: 175 },
  { id: '2', label: '2', x: 330, y: 175 },
  { id: '3', label: '3', x: 90, y: 268 },
  { id: '4', label: '4', x: 330, y: 268 },
  { id: '5', label: '5', x: 90, y: 361 },
  { id: '6', label: '6', x: 330, y: 361 },
  { id: '7', label: '7', x: 90, y: 454 },
  { id: '8', label: '8', x: 330, y: 454 },
]
