import { useEffect, useMemo, useState } from 'react'
import FloorPlan from './FloorPlan'
import Admin from './Admin'
import Gallery from './Gallery'
import PhotoUploader from './PhotoUploader'
import { remoteLookupExact, getLayout, type Guest } from './api'
import { DEFAULT_LAYOUT, type Layout } from './layout'
import {
  APPS_SCRIPT_URL,
  EVENT_TITLE,
  COUPLE_NAMES,
  GUEST_LOOKUP,
  SHOW_GALLERY,
} from './config'

const STORAGE_KEY = 'pfys.guest'
const LAYOUT_KEY = 'pfys.layout'

// Effective lookup source: 'auto' uses the Sheet once a URL is configured.
const SHEET_MODE =
  GUEST_LOOKUP === 'sheet' ||
  (GUEST_LOOKUP === 'auto' && Boolean(APPS_SCRIPT_URL))

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

// Local mode: exact full-name match (names are unique on first+last).
function localExact(fullName: string, guests: Guest[]): Guest | null {
  const q = normalize(fullName)
  return guests.find((g) => normalize(g.name) === q) ?? null
}

export default function App() {
  // ── tiny hash router so #admin opens the private builder ──
  const [route, setRoute] = useState(window.location.hash)
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const [guests, setGuests] = useState<Guest[]>([])
  const [loaded, setLoaded] = useState(SHEET_MODE)
  const [guest, setGuest] = useState<Guest | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {
      /* ignore corrupt value */
    }
    return null
  })
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [layout, setLayout] = useState<Layout>(() => {
    try {
      const cached = localStorage.getItem(LAYOUT_KEY)
      if (cached) return JSON.parse(cached)
    } catch {
      /* ignore */
    }
    return DEFAULT_LAYOUT
  })

  // Local mode: load the bundled guest list once.
  useEffect(() => {
    if (SHEET_MODE) return
    fetch(`${import.meta.env.BASE_URL}guests.json`)
      .then((r) => r.json())
      .then((data: Guest[]) => setGuests(data))
      .catch(() => setGuests([]))
      .finally(() => setLoaded(true))
  }, [])

  // Refresh the floor-plan layout from the server (if configured).
  useEffect(() => {
    getLayout().then((l) => {
      if (l) {
        setLayout(l)
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(l))
      }
    })
  }, [])

  // Run a lookup and, on a match, advance automatically.
  const runLookup = async (f: string, l: string) => {
    setSearching(true)
    try {
      const fullName = `${f} ${l}`
      const match = SHEET_MODE
        ? await remoteLookupExact(fullName)
        : localExact(fullName, guests)
      if (match) {
        setGuest(match)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(match))
        setError('')
      } else {
        setError("We can't find that name just yet — mind checking the spelling? 💛")
      }
    } catch {
      setError('Something hiccuped looking that up. Please try once more.')
    } finally {
      setSearching(false)
    }
  }

  // Auto-advance: whenever both names are filled, quietly check after a pause.
  useEffect(() => {
    setError('')
    const f = first.trim()
    const l = last.trim()
    if (!f || !l || !loaded) return
    const handle = setTimeout(() => runLookup(f, l), 500)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first, last, loaded, guests])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const f = first.trim()
    const l = last.trim()
    if (f && l && loaded && !searching) runLookup(f, l)
  }

  const handleSwitch = () => {
    localStorage.removeItem(STORAGE_KEY)
    setGuest(null)
    setFirst('')
    setLast('')
    setError('')
  }

  const greeting = useMemo(
    () => (guest ? guest.name.split(' ')[0] : ''),
    [guest],
  )

  if (route === '#admin') return <Admin />
  if (route === '#gallery') return <Gallery guest={guest} />

  // ── Welcome / name-entry screen ────────────────────────────
  if (!guest) {
    return (
      <div className="page">
        <div className="card welcome fade-in">
          <p className="eyebrow">Welcome</p>
          <h1 className="title">{EVENT_TITLE}</h1>
          {COUPLE_NAMES && <p className="couple">{COUPLE_NAMES}</p>}
          <p className="subtitle">
            Enter your name and your table will appear automatically.
          </p>
          <form onSubmit={handleSubmit} className="name-form">
            <div className="name-row">
              <input
                className="name-input"
                type="text"
                placeholder="First name"
                value={first}
                autoFocus
                autoComplete="given-name"
                onChange={(e) => setFirst(e.target.value)}
                aria-label="First name"
              />
              <input
                className="name-input"
                type="text"
                placeholder="Last name"
                value={last}
                autoComplete="family-name"
                onChange={(e) => setLast(e.target.value)}
                aria-label="Last name"
              />
            </div>
            <p className={`status ${searching ? 'status-on' : ''}`}>
              {searching ? 'Finding your seat…' : ' '}
            </p>
          </form>
          {error && <p className="error fade-in">{error}</p>}
        </div>
      </div>
    )
  }

  // ── Result screen ──────────────────────────────────────────
  return (
    <div className="page">
      <div className="card result fade-in">
        <p className="eyebrow">Welcome, {greeting}</p>
        <h1 className="title">Your Table</h1>
        <div className="table-badge">
          <span className="table-badge-label">Table</span>
          <span className="table-badge-number">{guest.table}</span>
        </div>

        <FloorPlan layout={layout} activeTable={guest.table} />

        {APPS_SCRIPT_URL && (
          <div className="upload">
            <PhotoUploader guestName={guest.name} />
          </div>
        )}

        {APPS_SCRIPT_URL && SHOW_GALLERY && (
          <a className="btn btn-ghost gallery-btn" href="#gallery">
            📸 View the Photo Wall
          </a>
        )}

        <button className="link-btn" onClick={handleSwitch}>
          Not you? Switch guest
        </button>
      </div>
    </div>
  )
}
