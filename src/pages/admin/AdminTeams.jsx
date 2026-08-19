import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { adminGetServiceAreas, adminUpdateServiceArea } from '../../lib/api.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import { Field, Input, Textarea } from '../../admin/components/FormField.jsx'

const COLOR_SWATCHES = [
  { name: 'Purple', hex: '#a78bfa' },
  { name: 'Blue',   hex: '#5b8cff' },
  { name: 'Green',  hex: '#4caf7d' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Red',    hex: '#ef4444' },
  { name: 'White',  hex: '#ffffff' },
]

function toFormState(area) {
  return {
    name:        area.name ?? '',
    icon:        area.icon ?? '',
    color:       area.color ?? COLOR_SWATCHES[0].hex,
    description: area.description ?? '',
  }
}

function TeamForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
      className="flex flex-col gap-3"
    >
      <Field label="Name">
        <Input value={form.name} onChange={(e) => update({ name: e.target.value })} required />
      </Field>

      <Field label="Icon class (e.g. fa-solid fa-music)">
        <div className="flex items-center gap-3">
          <Input
            value={form.icon}
            placeholder="fa-solid fa-music"
            onChange={(e) => update({ icon: e.target.value })}
            className="flex-1"
          />
          {form.icon && (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border"
              style={{ background: `${form.color}22` }}
            >
              <i className={form.icon} style={{ fontSize: '18px', color: form.color }} />
            </div>
          )}
        </div>
      </Field>

      <Field label="Color">
        <div className="flex gap-2 pt-0.5">
          {COLOR_SWATCHES.map((s) => (
            <button
              key={s.hex}
              type="button"
              onClick={() => update({ color: s.hex })}
              aria-label={s.name}
              className={`h-7 w-7 rounded-full border-2 transition-colors ${
                form.color === s.hex ? 'border-primary' : 'border-transparent'
              }`}
              style={{ backgroundColor: s.hex }}
            />
          ))}
        </div>
      </Field>

      <Field label="Description">
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </Field>

      <div className="mt-1 flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-border py-2.5 text-sm text-primary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-accent-blue py-2.5 text-sm font-medium text-bg disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function AdminTeams() {
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data, error: apiError } = await adminGetServiceAreas()
    if (apiError) { setError(true); setLoading(false); return }
    setAreas(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(form) {
    setSaving(true)
    await adminUpdateServiceArea(editTarget.id, {
      name:        form.name,
      icon:        form.icon,
      color:       form.color,
      description: form.description,
    })
    setSaving(false)
    setEditTarget(null)
    load()
  }

  return (
    <div>
      <div className="mb-1">
        <h1 className="text-lg font-medium text-primary">Service Teams</h1>
        <p className="mt-1 text-xs text-zinc-500">Edit name, icon, color and description for each team</p>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          {areas.map((area) => (
            <div
              key={area.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#1a1a1a',
                border: '0.5px solid #2e2e2e',
                borderRadius: '14px',
                padding: '14px',
              }}
            >
              {/* Icon preview */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${area.color ?? '#a78bfa'}26`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {area.icon
                  ? <i className={area.icon} style={{ fontSize: '18px', color: area.color ?? '#a78bfa' }} />
                  : <span style={{ fontSize: '11px', color: '#555' }}>—</span>
                }
              </div>

              {/* Name + macro badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-primary">{area.name}</p>
                  {area.is_macro && (
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">Macro</span>
                  )}
                </div>
                {area.description && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{area.description}</p>
                )}
              </div>

              {/* Active badge */}
              <span className={`shrink-0 text-xs ${area.active !== false ? 'text-accent-green' : 'text-zinc-600'}`}>
                {area.active !== false ? 'Active' : 'Hidden'}
              </span>

              {/* Edit */}
              <button
                type="button"
                onClick={() => setEditTarget(area)}
                aria-label="Edit"
                className="shrink-0 text-zinc-400 transition-colors hover:text-primary"
              >
                <Pencil size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editTarget && (
        <Modal title={`Edit — ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <TeamForm
            initial={toFormState(editTarget)}
            onSave={handleSave}
            onCancel={() => setEditTarget(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  )
}
