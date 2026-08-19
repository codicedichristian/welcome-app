import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { adminGetExploreCards, adminUpdateExploreCard } from '../../lib/api.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import { Field, Input, Textarea } from '../../admin/components/FormField.jsx'

const COLOR_SWATCHES = [
  { name: 'Purple', hex: '#a78bfa' },
  { name: 'Blue',   hex: '#5b8cff' },
  { name: 'White',  hex: '#ffffff' },
  { name: 'Green',  hex: '#4caf7d' },
  { name: 'Orange', hex: '#f97316' },
]

function toFormState(card) {
  return {
    title:       card.title ?? '',
    description: card.description ?? '',
    image_url:   card.image_url ?? '',
    pill_label:  card.pill_label ?? '',
    pill_color:  card.pill_color ?? COLOR_SWATCHES[0].hex,
    order_index: card.order_index ?? 0,
    active:      card.active ?? true,
  }
}

function ExploreForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
      className="flex flex-col gap-3"
    >
      <Field label="Title">
        <Input value={form.title} onChange={(e) => update({ title: e.target.value })} required />
      </Field>

      <Field label="Description">
        <Textarea rows={2} value={form.description} onChange={(e) => update({ description: e.target.value })} />
      </Field>

      <Field label="Image URL">
        <Input
          type="url"
          placeholder="https://..."
          value={form.image_url}
          onChange={(e) => update({ image_url: e.target.value })}
        />
      </Field>

      {form.image_url && (
        <div className="overflow-hidden rounded-xl border border-border" style={{ height: '80px' }}>
          <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pill label">
          <Input
            placeholder="e.g. Community"
            value={form.pill_label}
            onChange={(e) => update({ pill_label: e.target.value })}
          />
        </Field>
        <Field label="Order">
          <Input
            type="number"
            min={0}
            value={form.order_index}
            onChange={(e) => update({ order_index: Number(e.target.value) })}
          />
        </Field>
      </div>

      <Field label="Pill color">
        <div className="flex gap-2 pt-0.5">
          {COLOR_SWATCHES.map((s) => (
            <button
              key={s.hex}
              type="button"
              onClick={() => update({ pill_color: s.hex })}
              aria-label={s.name}
              className={`h-7 w-7 rounded-full border-2 transition-colors ${
                form.pill_color === s.hex ? 'border-primary' : 'border-transparent'
              }`}
              style={{ backgroundColor: s.hex }}
            />
          ))}
        </div>
      </Field>

      <label className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
        <span className="text-sm text-primary">Active</span>
        <button
          type="button"
          role="switch"
          aria-checked={form.active}
          onClick={() => update({ active: !form.active })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.active ? 'bg-primary' : 'bg-[#2a2a2a]'}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${form.active ? 'translate-x-5 bg-bg' : 'translate-x-0 bg-zinc-500'}`} />
        </button>
      </label>

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

export default function AdminExplore() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data, error: apiError } = await adminGetExploreCards()
    if (apiError) { setError(true); setLoading(false); return }
    setCards(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleOrderChange(card, newOrder) {
    setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, order_index: newOrder } : c))
    await adminUpdateExploreCard(card.id, { order_index: newOrder })
  }

  async function handleSave(form) {
    setSaving(true)
    await adminUpdateExploreCard(editTarget.id, form)
    setSaving(false)
    setEditTarget(null)
    load()
  }

  return (
    <div>
      <div className="mb-1">
        <h1 className="text-lg font-medium text-primary">Explore the Church</h1>
        <p className="mt-1 text-xs text-zinc-500">Drag to reorder — changes reflect immediately on the home screen</p>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          {cards.map((card) => (
            <div
              key={card.id}
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
              {/* Order input */}
              <input
                type="number"
                min={0}
                value={card.order_index}
                onChange={(e) => handleOrderChange(card, Number(e.target.value))}
                onBlur={(e) => handleOrderChange(card, Number(e.target.value))}
                className="w-10 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-primary outline-none"
              />

              {/* Image preview */}
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: '#2a2a2a', flexShrink: 0 }}>
                {card.image_url && (
                  <img src={card.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>

              {/* Title + pill */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{card.title}</p>
                {card.pill_label && (
                  <span
                    className="mt-0.5 inline-block text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: card.pill_color ?? '#a78bfa' }}
                  >
                    {card.pill_label}
                  </span>
                )}
              </div>

              {/* Active badge */}
              <span className={`shrink-0 text-xs ${card.active ? 'text-accent-green' : 'text-zinc-600'}`}>
                {card.active ? 'Active' : 'Hidden'}
              </span>

              {/* Edit */}
              <button
                type="button"
                onClick={() => setEditTarget(card)}
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
        <Modal title="Edit card" onClose={() => setEditTarget(null)}>
          <ExploreForm
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
