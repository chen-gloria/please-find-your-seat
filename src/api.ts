import { APPS_SCRIPT_URL } from './config'
import type { Layout } from './layout'

export type Guest = { name: string; table: string }

// ── Guest lookup (Sheet mode) ────────────────────────────────
// Exact match only, so auto-advance never fires on a half-typed name.
export async function remoteLookupExact(
  fullName: string,
): Promise<Guest | null> {
  const url = `${APPS_SCRIPT_URL}?name=${encodeURIComponent(
    fullName.trim(),
  )}&exact=1`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.ok) return null
  return { name: String(data.name), table: String(data.table) }
}

// ── Floor-plan layout ────────────────────────────────────────
export async function getLayout(): Promise<Layout | null> {
  if (!APPS_SCRIPT_URL) return null
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?layout=1`)
    const data = await res.json()
    return data.ok && data.layout ? (data.layout as Layout) : null
  } catch {
    return null
  }
}

export async function saveLayout(
  password: string,
  layout: Layout,
): Promise<{ ok: boolean; error?: string }> {
  if (!APPS_SCRIPT_URL) {
    return { ok: false, error: 'APPS_SCRIPT_URL is not set in src/config.ts.' }
  }
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'saveLayout', password, layout }),
  })
  const data = await res.json().catch(() => ({ ok: false }))
  return data
}

// ── Photo gallery ────────────────────────────────────────────
export type Photo = { id: string; name: string }

export async function listPhotos(): Promise<Photo[]> {
  if (!APPS_SCRIPT_URL) return []
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?photos=1`)
    const data = await res.json()
    return Array.isArray(data.photos) ? (data.photos as Photo[]) : []
  } catch {
    return []
  }
}

// A CDN-resized thumbnail served from Google's image servers — tiny + fast.
// `size` is the width in px (e.g. 400 for the grid, 1600 for the lightbox).
export function photoUrl(id: string, size: number): string {
  return `https://lh3.googleusercontent.com/d/${id}=w${size}`
}
