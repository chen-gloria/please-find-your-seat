import { useMemo, useState } from 'react'
import FloorPlan from './FloorPlan'
import { saveLayout } from './api'
import {
  DEFAULT_LAYOUT,
  normalizeLabels,
  totalTables,
  type Layout,
} from './layout'

const LAYOUT_KEY = 'pfys.layout'

function loadInitial(): Layout {
  try {
    const cached = localStorage.getItem(LAYOUT_KEY)
    if (cached) return JSON.parse(cached)
  } catch {
    /* ignore */
  }
  return DEFAULT_LAYOUT
}

export default function Admin() {
  const initial = loadInitial()
  const [password, setPassword] = useState('')
  const [rows, setRows] = useState<number[]>(initial.rows)
  const [labels, setLabels] = useState<string[]>(
    normalizeLabels(initial.rows, initial.labels),
  )
  const [status, setStatus] = useState<{ kind: 'ok' | 'err' | ''; msg: string }>({
    kind: '',
    msg: '',
  })
  const [saving, setSaving] = useState(false)

  const layout: Layout = useMemo(
    () => ({ rows, labels: normalizeLabels(rows, labels) }),
    [rows, labels],
  )

  const setRowCount = (i: number, value: number) => {
    const next = rows.slice()
    next[i] = Math.max(0, Math.min(12, Math.floor(value) || 0))
    setRows(next)
    setLabels((prev) => normalizeLabels(next, prev))
  }

  const addRow = () => {
    const next = [...rows, 4]
    setRows(next)
    setLabels((prev) => normalizeLabels(next, prev))
  }

  const removeRow = (i: number) => {
    const next = rows.filter((_, k) => k !== i)
    setRows(next.length ? next : [4])
    setLabels((prev) => normalizeLabels(next.length ? next : [4], prev))
  }

  const setLabel = (idx: number, value: string) => {
    setLabels((prev) => {
      const next = prev.slice()
      next[idx] = value
      return next
    })
  }

  const publish = async () => {
    setSaving(true)
    setStatus({ kind: '', msg: '' })
    const res = await saveLayout(password, layout)
    setSaving(false)
    if (res.ok) {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
      setStatus({ kind: 'ok', msg: 'Published! Guests will see this now.' })
    } else {
      setStatus({ kind: 'err', msg: res.error || 'Could not publish.' })
    }
  }

  const copyJson = () => {
    navigator.clipboard?.writeText(JSON.stringify(layout, null, 2))
    setStatus({ kind: 'ok', msg: 'Layout JSON copied to clipboard.' })
  }

  // running index → which row each label belongs to (for grouping)
  const rowRanges = useMemo(() => {
    const ranges: { start: number; count: number }[] = []
    let start = 0
    rows.forEach((c) => {
      ranges.push({ start, count: c })
      start += c
    })
    return ranges
  }, [rows])

  return (
    <div className="admin">
      <header className="admin-head">
        <h1>Floor Plan Builder</h1>
        <p className="admin-sub">
          Set how many tables sit in each row (front row first). The room's
          front is the top edge — all tables face it.
        </p>
      </header>

      <div className="admin-grid">
        {/* Controls */}
        <div className="admin-panel">
          <label className="admin-field">
            <span>Admin password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="required to publish"
            />
          </label>

          <div className="admin-rows">
            <div className="admin-rows-head">
              <span>Rows ({totalTables(layout)} tables)</span>
              <button className="mini-btn" onClick={addRow} type="button">
                + Add row
              </button>
            </div>

            {rows.map((count, i) => (
              <div className="admin-row" key={i}>
                <span className="row-tag">
                  Row {i + 1}
                  {i === 0 ? ' (front)' : ''}
                </span>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={count}
                  onChange={(e) => setRowCount(i, Number(e.target.value))}
                />
                <span className="row-unit">tables</span>
                {rows.length > 1 && (
                  <button
                    className="mini-btn danger"
                    type="button"
                    onClick={() => removeRow(i)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="admin-labels">
            <span className="admin-labels-head">
              Table labels (must match the “table” column in your Sheet)
            </span>
            {rowRanges.map((rng, i) => (
              <div className="label-row" key={i}>
                <span className="row-tag">Row {i + 1}</span>
                <div className="label-inputs">
                  {Array.from({ length: rng.count }).map((_, j) => {
                    const idx = rng.start + j
                    return (
                      <input
                        key={idx}
                        className="label-input"
                        value={labels[idx] ?? ''}
                        onChange={(e) => setLabel(idx, e.target.value)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="admin-actions">
            <button
              className="btn"
              type="button"
              onClick={publish}
              disabled={saving || !password}
            >
              {saving ? 'Publishing…' : 'Publish to guests'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={copyJson}>
              Copy JSON
            </button>
          </div>

          {status.msg && (
            <p className={status.kind === 'err' ? 'error' : 'upload-msg'}>
              {status.msg}
            </p>
          )}
          <a className="link-btn" href="#">
            ← Back to guest view
          </a>
        </div>

        {/* Live preview */}
        <div className="admin-preview">
          <FloorPlan layout={layout} activeTable={null} />
        </div>
      </div>
    </div>
  )
}
