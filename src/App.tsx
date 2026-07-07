import { useEffect, useMemo, useRef, useState } from 'react'
import FloorPlan from './FloorPlan'
import { uploadPhoto } from './photo'
import { APPS_SCRIPT_URL, EVENT_TITLE, COUPLE_NAMES } from './config'

type Guest = { name: string; table: string }

const STORAGE_KEY = 'pfys.guest'

const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, ' ')

// Find a guest from a typed name. Tolerant: exact match first, then a
// unique prefix/substring match (so "kenneth" finds "Kenneth Lo" if unique).
function findGuest(query: string, guests: Guest[]): Guest | 'ambiguous' | null {
  const q = normalize(query)
  if (!q) return null

  const exact = guests.find((g) => normalize(g.name) === q)
  if (exact) return exact

  const prefix = guests.filter((g) => normalize(g.name).startsWith(q))
  if (prefix.length === 1) return prefix[0]
  if (prefix.length > 1) return 'ambiguous'

  const includes = guests.filter((g) => normalize(g.name).includes(q))
  if (includes.length === 1) return includes[0]
  if (includes.length > 1) return 'ambiguous'

  return null
}

export default function App() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loaded, setLoaded] = useState(false)
  const [guest, setGuest] = useState<Guest | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [uploadState, setUploadState] = useState<
    'idle' | 'uploading' | 'done' | 'error'
  >('idle')
  const [uploadMsg, setUploadMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load the guest list (bundled static file).
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}guests.json`)
      .then((r) => r.json())
      .then((data: Guest[]) => setGuests(data))
      .catch(() => setGuests([]))
      .finally(() => setLoaded(true))
  }, [])

  // Restore "logged in" guest from localStorage.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setGuest(JSON.parse(raw))
      } catch {
        /* ignore corrupt value */
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const result = findGuest(query, guests)
    if (result === 'ambiguous') {
      setError('We found more than one match — please type your full name.')
      return
    }
    if (!result) {
      setError("Hmm, we couldn't find that name. Please check the spelling.")
      return
    }
    setGuest(result)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  }

  const handleSwitch = () => {
    localStorage.removeItem(STORAGE_KEY)
    setGuest(null)
    setQuery('')
    setError('')
    setUploadState('idle')
    setUploadMsg('')
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !guest) return
    setUploadState('uploading')
    setUploadMsg('Uploading your photo…')
    try {
      await uploadPhoto(file, guest.name)
      setUploadState('done')
      setUploadMsg('Thank you! Your photo has been shared 💛')
    } catch (err) {
      setUploadState('error')
      setUploadMsg(
        err instanceof Error ? err.message : 'Upload failed — please try again.',
      )
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const activeTable = guest?.table ?? null

  const greeting = useMemo(() => {
    if (!guest) return ''
    return guest.name.split(' ')[0]
  }, [guest])

  // ── Welcome / name-entry screen ────────────────────────────
  if (!guest) {
    return (
      <div className="page">
        <div className="card welcome fade-in">
          <p className="eyebrow">Welcome</p>
          <h1 className="title">{EVENT_TITLE}</h1>
          {COUPLE_NAMES && <p className="couple">{COUPLE_NAMES}</p>}
          <p className="subtitle">
            Enter your name and we'll show you to your table.
          </p>
          <form onSubmit={handleSubmit} className="name-form">
            <input
              className="name-input"
              type="text"
              placeholder="Your name"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Your name"
            />
            <button className="btn" type="submit" disabled={!loaded}>
              {loaded ? 'Find My Seat' : 'Loading…'}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
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

        <FloorPlan activeTable={activeTable} />

        {APPS_SCRIPT_URL && (
          <div className="upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="visually-hidden"
              id="photo-input"
              onChange={handleFile}
            />
            <label htmlFor="photo-input" className="btn btn-secondary">
              {uploadState === 'uploading' ? 'Uploading…' : '📷 Share a Photo'}
            </label>
            {uploadMsg && (
              <p
                className={
                  uploadState === 'error' ? 'error' : 'upload-msg'
                }
              >
                {uploadMsg}
              </p>
            )}
          </div>
        )}

        <button className="link-btn" onClick={handleSwitch}>
          Not you? Switch guest
        </button>
      </div>
    </div>
  )
}
