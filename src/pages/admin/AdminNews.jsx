import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { adminGetNews, adminCreateNews, adminUpdateNews, adminDeleteNews } from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import { safeUrl, trimField } from '../../lib/sanitize.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { Field, Input, Textarea, Select } from '../../admin/components/FormField.jsx'
import ImageUploader from '../../components/admin/ImageUploader.jsx'
import { deeplTranslate } from '../../lib/deepl.js'
import { td } from '../../utils/td.js'

const CATEGORY_OPTIONS = ['Announcement', 'Event', 'General']
const COLOR_SWATCHES = [
  { name: 'Blue', hex: '#5b8cff' },
  { name: 'Green', hex: '#4caf7d' },
  { name: 'Purple', hex: '#a78bfa' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'White', hex: '#ffffff' },
]

const EMPTY_NEWS = {
  title_es: '',
  title_en: '',
  body_es: '',
  body_en: '',
  category: 'Announcement',
  color: COLOR_SWATCHES[0].hex,
  published_at: new Date().toISOString().slice(0, 10),
  image_url: '',
  link_url: '',
}

function toFormState(item) {
  const rawTitle = item.title ?? {}
  const rawBody = item.body ?? {}
  return {
    title_es: (typeof rawTitle === 'string' ? rawTitle : (rawTitle.es ?? '')),
    title_en: (typeof rawTitle === 'object' ? (rawTitle.en ?? '') : ''),
    body_es: (typeof rawBody === 'string' ? rawBody : (rawBody.es ?? '')),
    body_en: (typeof rawBody === 'object' ? (rawBody.en ?? '') : ''),
    category: item.category ?? 'Announcement',
    color: item.color ?? COLOR_SWATCHES[0].hex,
    published_at: item.published_at ?? new Date().toISOString().slice(0, 10),
    image_url: item.image_url ?? '',
    link_url: item.link_url ?? '',
  }
}

function TranslateBtn({ onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title="Translate ES → EN"
      className="shrink-0 rounded-lg border border-border px-2.5 py-2 text-xs text-zinc-400 transition-colors hover:text-primary disabled:opacity-40"
    >
      {loading ? '…' : 'EN ✨'}
    </button>
  )
}

function NewsForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const [translating, setTranslating] = useState(null)

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const translate = async (srcKey, dstKey) => {
    if (!form[srcKey]?.trim()) return
    setTranslating(dstKey)
    try {
      const result = await deeplTranslate(form[srcKey], 'EN')
      update({ [dstKey]: result })
    } catch (e) {
      console.error('DeepL error', e)
    } finally {
      setTranslating(null)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          ...form,
          title:     { es: trimField(form.title_es), en: trimField(form.title_en) },
          body:      { es: trimField(form.body_es), en: trimField(form.body_en) },
          image_url: safeUrl(form.image_url),
          link_url:  safeUrl(form.link_url),
        })
      }}
      className="flex flex-col gap-3"
    >
      <Field label="Title">
        <div className="flex flex-col gap-2">
          <Input placeholder="Español" value={form.title_es} onChange={(e) => update({ title_es: e.target.value })} required />
          <div className="flex items-center gap-2">
            <Input placeholder="English" value={form.title_en} onChange={(e) => update({ title_en: e.target.value })} />
            <TranslateBtn onClick={() => translate('title_es', 'title_en')} loading={translating === 'title_en'} />
          </div>
        </div>
      </Field>

      <Field label="Body">
        <div className="flex flex-col gap-2">
          <Textarea rows={4} placeholder="Español" value={form.body_es} onChange={(e) => update({ body_es: e.target.value })} required />
          <div className="flex items-start gap-2">
            <Textarea rows={4} placeholder="English" value={form.body_en} onChange={(e) => update({ body_en: e.target.value })} />
            <TranslateBtn onClick={() => translate('body_es', 'body_en')} loading={translating === 'body_en'} />
          </div>
        </div>
      </Field>

      <ImageUploader
        folder="news"
        imageUrl={form.image_url}
        onUpload={(url) => update({ image_url: url })}
        label="Cover image"
      />

      <Field label="External link (optional)">
        <Input
          type="url"
          placeholder="https://..."
          value={form.link_url}
          onChange={(e) => update({ link_url: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Select value={form.category} onChange={(e) => update({ category: e.target.value })}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Published date">
          <Input type="date" value={form.published_at} onChange={(e) => update({ published_at: e.target.value })} />
        </Field>
      </div>

      <Field label="Color">
        <div className="flex gap-2">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch.hex}
              type="button"
              onClick={() => update({ color: swatch.hex })}
              aria-label={swatch.name}
              className={`h-8 w-8 rounded-full border-2 transition-colors ${
                form.color === swatch.hex ? 'border-primary' : 'border-transparent'
              }`}
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
      </Field>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-border py-2.5 text-sm text-primary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-bg disabled:opacity-60">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function AdminNews() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalItem, setModalItem] = useState(null) // 'new' | item | null
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data, error: apiError } = await adminGetNews()
    if (apiError) {
      setError(true)
    } else {
      setNews(data ?? [])
      setError(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    adminGetNews().then(({ data, error: apiError }) => {
      if (cancelled) return
      if (apiError) {
        setError(true)
      } else {
        setNews(data ?? [])
        setError(false)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async (payload) => {
    setSaving(true)
    const { error: apiError } = modalItem === 'new' ? await adminCreateNews(payload) : await adminUpdateNews(modalItem.id, payload)
    setSaving(false)

    if (!apiError) {
      setModalItem(null)
      load()
    }
  }

  const handleDelete = async () => {
    const { error: apiError } = await adminDeleteNews(deleteTarget.id)
    if (!apiError) {
      setDeleteTarget(null)
      load()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-primary">News</h1>
        <button
          type="button"
          onClick={() => setModalItem('new')}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-bg"
        >
          <Plus size={16} />
          <span>Add News</span>
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-zinc-500">
                <th className="px-4 py-3 font-normal">Title</th>
                <th className="px-4 py-3 font-normal">Category</th>
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {news.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                    No news yet
                  </td>
                </tr>
              ) : (
                news.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-primary">{td(item.title)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-1 text-xs font-medium text-bg" style={{ backgroundColor: item.color }}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{formatShortDate(item.published_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setModalItem(item)} aria-label="Edit" className="text-zinc-400 transition-colors hover:text-primary">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(item)} aria-label="Delete" className="text-zinc-400 transition-colors hover:text-[#e55555]">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalItem && (
        <Modal title={modalItem === 'new' ? 'Add News' : 'Edit News'} onClose={() => setModalItem(null)}>
          <NewsForm
            initial={modalItem === 'new' ? EMPTY_NEWS : toFormState(modalItem)}
            onSave={handleSave}
            onCancel={() => setModalItem(null)}
            saving={saving}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete news"
          message={`Are you sure you want to delete "${td(deleteTarget.title)}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
