import { useRef, useState } from 'react'
import { FileIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'

function sanitizeFilename(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip accents
    .replace(/[^a-zA-Z0-9._-]/g, '_') // replace any non-safe char with _
    .replace(/_+/g, '_')               // collapse multiple underscores
}

export default function FileUploader({ folder, fileUrl, onUpload, label, accept = '*/*', buttonLabel = 'Upload file' }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setUploadError(false)

    const path = `${folder}/${Date.now()}_${sanitizeFilename(file.name)}`
    const { error } = await supabase.storage.from('files').upload(path, file, { upsert: true })

    if (error) {
      setUploadError(true)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('files').getPublicUrl(path)
    onUpload(data.publicUrl)
    setUploading(false)
  }

  // Extract filename from URL for display
  const fileName = fileUrl ? decodeURIComponent(fileUrl.split('/').pop().split('?')[0]) : null

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs text-zinc-500">{label}</span>}

      <div className="flex items-center gap-3">
        <div
          className="shrink-0 rounded-lg border border-zinc-700 flex items-center justify-center"
          style={{ width: '48px', height: '48px', background: '#1a1a1a' }}
        >
          <FileIcon size={20} className={fileUrl ? 'text-zinc-300' : 'text-zinc-600'} />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {fileName && (
            <span className="text-[11px] text-zinc-400 truncate">{fileName}</span>
          )}
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 transition-opacity disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-zinc-500 border-t-zinc-300" />
                  Uploading…
                </>
              ) : buttonLabel}
            </button>
            {uploadError && <span className="text-[11px] text-red-500">Upload failed</span>}
          </div>
        </div>
      </div>

      <input
        type="url"
        placeholder="Or paste URL"
        value={fileUrl || ''}
        onChange={(e) => { setUploadError(false); onUpload(e.target.value) }}
        className="w-full rounded-[10px] border border-zinc-800 bg-[#111] px-3 py-2 text-[13px] text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
      />
    </div>
  )
}
