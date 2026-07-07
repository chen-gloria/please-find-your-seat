import { APPS_SCRIPT_URL, PHOTO_MAX_DIMENSION } from './config'

// Downscale a photo in the browser (canvas) so uploads stay small/fast,
// then return it as a base64 string (no data-URL prefix) + mime type.
async function fileToResizedBase64(
  file: File,
): Promise<{ base64: string; mimeType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })

  const scale = Math.min(1, PHOTO_MAX_DIMENSION / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    // Fallback: send the original untouched.
    const comma = dataUrl.indexOf(',')
    return { base64: dataUrl.slice(comma + 1), mimeType: file.type || 'image/jpeg' }
  }
  ctx.drawImage(img, 0, 0, w, h)
  const outUrl = canvas.toDataURL('image/jpeg', 0.85)
  return { base64: outUrl.slice(outUrl.indexOf(',') + 1), mimeType: 'image/jpeg' }
}

export async function uploadPhoto(file: File, guestName: string): Promise<void> {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Photo upload is not configured yet.')
  }
  const { base64, mimeType } = await fileToResizedBase64(file)

  // NOTE on CORS: we send the body as a plain string (default fetch
  // Content-Type is text/plain), which is a "simple" request and avoids a
  // preflight that Apps Script cannot answer. Apps Script redirects to
  // googleusercontent.com which returns Access-Control-Allow-Origin: *,
  // so we can read the JSON response back.
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ guestName, imageBase64: base64, mimeType }),
  })
  const data = await res.json().catch(() => ({ ok: res.ok }))
  if (!data.ok) {
    throw new Error(data.error || 'Upload failed')
  }
}
