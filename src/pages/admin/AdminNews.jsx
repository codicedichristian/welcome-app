import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { adminGetNews, adminCreateNews, adminUpdateNews, adminDeleteNews } from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { Field, Input, Textarea, Select } from '../../admin/components/FormField.jsx'

const CATEGORY_OPTIONS = ['Announcement', 'Event', 'General']
const COLOR_SWATCHES = [
  { name: 'Blue', hex: '#5b8cff' },
  { name: 'Green', hex: '#4caf7d' },
  { name: 'Purple', hex: '#a78bfa' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'White', hex: '#ffffff' },
]

const EMPTY_NEWS = {
  title: '',
  body: '',
  category: 'Announcement',
  color: COLOR_SWATCHES[0].hex,
  published_at: new Date().toISOString().slice(0, 10),
}

function toFormState(item) {
  return {
    title: item.title ?? '',
    body: item.body ?? '',
    category: item.category ?? 'Announcement',
    color: item.color ?? COLOR_SWATCHES[0].hex,
    published_at: item.published_at ?? new Date().toISOString().slice(0, 10),
  }
}

function NewsForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
      className="flex flex-col gap-3"
    >
      <Field label="Title">
        <Input value={form.title} onChange={(e) => update({ title: e.target.value })} required />
      </Field>

      <Field label="Body">
        <Textarea rows={6} value={form.body} onChange={(e) => update({ body: e.target.value })} required />
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
                    <td className="px-4 py-3 text-primary">{item.title}</td>
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
          message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
