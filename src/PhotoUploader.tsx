import { useRef, useState } from 'react'
import { uploadPhoto } from './photo'

type Pending = { key: string; file: File; url: string }

let counter = 0

export default function PhotoUploader({ guestName }: { guestName: string }) {
  const [queue, setQueue] = useState<Pending[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [msg, setMsg] = useState('')
  const [msgKind, setMsgKind] = useState<'ok' | 'err' | ''>('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const pickRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const added: Pending[] = Array.from(files).map((file) => ({
      key: `p${counter++}`,
      file,
      url: URL.createObjectURL(file),
    }))
    setQueue((q) => [...q, ...added])
    setMsg('')
    setMsgKind('')
  }

  const removeItem = (key: string) => {
    setQueue((q) => {
      const item = q.find((p) => p.key === key)
      if (item) URL.revokeObjectURL(item.url)
      return q.filter((p) => p.key !== key)
    })
  }

  const uploadAll = async () => {
    if (queue.length === 0 || uploading) return
    setUploading(true)
    setMsg('')
    setMsgKind('')
    setProgress({ done: 0, total: queue.length })

    let failed = 0
    for (let i = 0; i < queue.length; i++) {
      try {
        await uploadPhoto(queue[i].file, guestName)
      } catch {
        failed++
      }
      setProgress({ done: i + 1, total: queue.length })
    }

    queue.forEach((p) => URL.revokeObjectURL(p.url))
    setQueue([])
    setUploading(false)
    if (failed === 0) {
      setMsgKind('ok')
      setMsg('Thank you! Taking you to the photo wall…')
      // Auto-open the gallery so guests see their photos land on the wall.
      window.setTimeout(() => {
        window.location.hash = 'gallery'
      }, 900)
    } else {
      setMsgKind('err')
      setMsg(`Shared with ${failed} that didn't go through — please retry those.`)
    }
  }

  return (
    <div className="uploader">
      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="visually-hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={pickRef}
        type="file"
        accept="image/*"
        multiple
        className="visually-hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="uploader-btns">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
        >
          📷 Take a Photo
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => pickRef.current?.click()}
          disabled={uploading}
        >
          🖼 Choose Photos
        </button>
      </div>

      {queue.length > 0 && (
        <div className="tray fade-in">
          <div className="tray-grid">
            {queue.map((p) => (
              <div className="tray-item" key={p.key}>
                <img src={p.url} alt="" />
                {!uploading && (
                  <button
                    type="button"
                    className="tray-remove"
                    onClick={() => removeItem(p.key)}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            onClick={uploadAll}
            disabled={uploading}
          >
            {uploading
              ? `Uploading ${progress.done}/${progress.total}…`
              : `Upload ${queue.length} photo${queue.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {msg && <p className={msgKind === 'err' ? 'error' : 'upload-msg'}>{msg}</p>}
    </div>
  )
}
