import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { adminGetSeasons, adminCreateSeason, adminUpdateSeason, adminDeleteSeason } from '../../lib/api.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { Field, Input, Textarea } from '../../admin/components/FormField.jsx'
import ImageUploader from '../../components/admin/ImageUploader.jsx'

const EMPTY = { name: '', description: '', image_url: '', start_date: '', end_date: '' }

function toFormState(s) {
  return {
    name: s.name ?? '',
    description: s.description ?? '',
    image_url: s.image_url ?? '',
    start_date: s.start_date ?? '',
    end_date: s.end_date ?? '',
  }
}

function formatDateRange(start, end) {
  const fmt = (d) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const s = fmt(start)
  const e = fmt(end)
  if (s && e) return `${s} – ${e}`
  if (s) return `From ${s}`
  return '—'
}

function SeasonForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
      className="space-y-4"
    >
      <Field label="Name">
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Spring Series 2025" />
      </Field>
      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="Brief description of the season"
        />
      </Field>
      <ImageUploader
        folder="seasons"
        imageUrl={form.image_url}
        onUpload={(url) => set('image_url', url)}
        label="Season image"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <Input value={form.start_date} onChange={(e) => set('start_date', e.target.value)} type="date" />
        </Field>
        <Field label="End date">
          <Input value={form.end_date} onChange={(e) => set('end_date', e.target.value)} type="date" />
        </Field>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-accent-blue py-2.5 text-sm font-medium text-bg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalItem, setModalItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data, error: apiError } = await adminGetSeasons()
    if (apiError) { setError(true); setLoading(false); return }
    setSeasons(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(form) {
    setSaving(true)
    if (modalItem === 'new') {
      await adminCreateSeason(form)
    } else {
      await adminUpdateSeason(modalItem.id, form)
    }
    setSaving(false)
    setModalItem(null)
    load()
  }

  async function handleDelete() {
    await adminDeleteSeason(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-primary">Seasons</h1>
        <button
          type="button"
          onClick={() => setModalItem('new')}
          className="flex items-center gap-2 rounded-xl bg-accent-blue px-4 py-2 text-sm font-medium text-bg transition-colors"
        >
          <Plus size={16} />
          Add Season
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">Date range</th>
                <th className="px-4 py-3 font-normal">Description</th>
                <th className="px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {seasons.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                    No seasons yet
                  </td>
                </tr>
              ) : (
                seasons.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-medium text-primary">{s.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{formatDateRange(s.start_date, s.end_date)}</td>
                    <td className="max-w-xs px-4 py-3 text-zinc-400 truncate">{s.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setModalItem(s)}
                          aria-label="Edit"
                          className="text-zinc-400 transition-colors hover:text-primary"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          aria-label="Delete"
                          className="text-zinc-400 transition-colors hover:text-[#e55555]"
                        >
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
        <Modal
          title={modalItem === 'new' ? 'Add Season' : 'Edit Season'}
          onClose={() => setModalItem(null)}
        >
          <SeasonForm
            initial={modalItem === 'new' ? EMPTY : toFormState(modalItem)}
            onSave={handleSave}
            onCancel={() => setModalItem(null)}
            saving={saving}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete season"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
