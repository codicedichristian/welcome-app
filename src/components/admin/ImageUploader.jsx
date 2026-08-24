import { useRef, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'

export default function ImageUploader({ folder, imageUrl, onUpload, label }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setUploadError(false)

    const path = `${folder}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true })

    if (error) {
      setUploadError(true)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('images').getPublicUrl(path)
    onUpload(data.publicUrl)
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs text-zinc-500">{label}</span>}

      <div className="flex items-start gap-3">
        <div
          className="shrink-0 overflow-hidden rounded-lg border border-zinc-700"
          style={{ width: '80px', height: '80px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <ImageIcon size={24} className="text-zinc-600" />
          )}
        </div>

        <div className="flex flex-col gap-1.5 pt-0.5">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
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
            ) : 'Upload image'}
          </button>
          {uploadError && <span className="text-[11px] text-red-500">Upload failed</span>}
        </div>
      </div>

      <input
        type="url"
        placeholder="Or paste image URL"
        value={imageUrl || ''}
        onChange={(e) => { setUploadError(false); onUpload(e.target.value) }}
        className="w-full rounded-[10px] border border-zinc-800 bg-[#111] px-3 py-2 text-[13px] text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
      />
    </div>
  )
}
