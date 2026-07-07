// ─────────────────────────────────────────────────────────────
//  FLOOR PLAN LAYOUT ENGINE
//  A rectangular room whose FRONT is the top edge (projectors /
//  backdrop). Tables are laid out in rows, all facing the front.
//  The admin only chooses how many tables sit in each row; this file
//  turns that into coordinates.
// ─────────────────────────────────────────────────────────────

export const VIEW_W = 1000
export const VIEW_H = 1000

// What the admin edits + what gets stored/served.
export type Layout = {
  rows: number[] // tables per row, FRONT row first
  labels: string[] // table label per table, in row order (matches Sheet "table")
}

export const DEFAULT_LAYOUT: Layout = {
  rows: [4, 4],
  labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
}

export function totalTables(l: Layout): number {
  return l.rows.reduce((a, b) => a + b, 0)
}

// Ensure labels array length matches the number of tables (fill with
// sequential numbers, trim extras).
export function normalizeLabels(rows: number[], labels: string[]): string[] {
  const n = rows.reduce((a, b) => a + b, 0)
  const out = labels.slice(0, n)
  for (let i = out.length; i < n; i++) out.push(String(i + 1))
  return out
}

export type PlacedTable = {
  id: string
  label: string
  x: number
  y: number
  r: number
}

// Region of the canvas the tables live in (below the dance floor, above bar).
const AREA = { left: 80, right: 920, top: 405, bottom: 885 }

export function placeTables(layout: Layout): PlacedTable[] {
  const rows = layout.rows.filter((n) => n > 0)
  if (rows.length === 0) return []
  const labels = normalizeLabels(layout.rows, layout.labels)

  const rowH = (AREA.bottom - AREA.top) / rows.length
  const maxPerRow = Math.max(...rows)
  const colW = (AREA.right - AREA.left) / maxPerRow
  const r = Math.max(22, Math.min(70, Math.min(rowH, colW) * 0.36))

  const out: PlacedTable[] = []
  let idx = 0
  rows.forEach((count, i) => {
    const y = AREA.top + rowH * (i + 0.5)
    const gap = (AREA.right - AREA.left) / count
    for (let j = 0; j < count; j++) {
      const x = AREA.left + gap * (j + 0.5)
      const label = labels[idx] ?? String(idx + 1)
      out.push({ id: label, label, x, y, r })
      idx++
    }
  })
  return out
}

// ── Fixed room features (match the reference floor plan) ──────
export type Feature = {
  key: string
  label: string
  x: number
  y: number
  w: number
  h: number
  variant: 'wall' | 'accent' | 'floor' | 'door' | 'plain'
  vertical?: boolean
}

export const FEATURES: Feature[] = [
  { key: 'proj1', label: 'Projector 1', x: 170, y: 40, w: 210, h: 44, variant: 'wall' },
  { key: 'backdrop', label: 'Backdrop', x: 395, y: 40, w: 210, h: 44, variant: 'wall' },
  { key: 'proj2', label: 'Projector 2', x: 620, y: 40, w: 210, h: 44, variant: 'wall' },
  { key: 'accent', label: '', x: 24, y: 92, w: 952, h: 24, variant: 'accent' },
  { key: 'floor', label: 'Dancing Floor', x: 24, y: 116, w: 952, h: 250, variant: 'floor' },
  { key: 'ktv', label: 'KTV Machine', x: 60, y: 140, w: 150, h: 46, variant: 'plain' },
  { key: 'door', label: 'Door', x: 952, y: 150, w: 24, h: 150, variant: 'door', vertical: true },
  { key: 'bar', label: 'Bar', x: 120, y: 905, w: 340, h: 50, variant: 'plain' },
]
