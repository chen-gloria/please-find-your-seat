import { useEffect, useState } from 'react'
import { listPhotos, photoUrl, photoUrlAlt, type Photo } from './api'
import { EVENT_TITLE } from './config'

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    listPhotos()
      .then(setPhotos)
      .finally(() => setLoading(false))
  }, [])

  // Keyboard nav in the lightbox
  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
      if (e.key === 'ArrowRight') setActive((i) => (i === null ? i : Math.min(photos.length - 1, i + 1)))
      if (e.key === 'ArrowLeft') setActive((i) => (i === null ? i : Math.max(0, i - 1)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, photos.length])

  return (
    <div className="gallery">
      <header className="gallery-head">
        <p className="eyebrow">{EVENT_TITLE}</p>
        <h1 className="title">Photo Wall</h1>
        <a className="link-btn" href="#">
          ← Back
        </a>
      </header>

      {loading && <p className="gallery-note">Loading photos…</p>}
      {!loading && photos.length === 0 && (
        <p className="gallery-note">No photos yet — be the first to share one 💛</p>
      )}

      <div className="gallery-grid">
        {photos.map((p, i) => (
          <button
            key={p.id}
            className="gallery-cell"
            onClick={() => setActive(i)}
            aria-label={`Open photo ${i + 1}`}
          >
            <img
              src={photoUrl(p.id, 400)}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const el = e.currentTarget
                if (!el.dataset.fb) {
                  el.dataset.fb = '1'
                  el.src = photoUrlAlt(p.id, 400)
                }
              }}
            />
          </button>
        ))}
      </div>

      {active !== null && photos[active] && (
        <div className="lightbox" onClick={() => setActive(null)}>
          <button className="lb-close" aria-label="Close">
            ✕
          </button>
          {active > 0 && (
            <button
              className="lb-nav lb-prev"
              onClick={(e) => {
                e.stopPropagation()
                setActive(active - 1)
              }}
              aria-label="Previous"
            >
              ‹
            </button>
          )}
          <img
            src={photoUrl(photos[active].id, 1600)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              const el = e.currentTarget
              if (!el.dataset.fb) {
                el.dataset.fb = '1'
                el.src = photoUrlAlt(photos[active].id, 1600)
              }
            }}
          />
          {active < photos.length - 1 && (
            <button
              className="lb-nav lb-next"
              onClick={(e) => {
                e.stopPropagation()
                setActive(active + 1)
              }}
              aria-label="Next"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  )
}
