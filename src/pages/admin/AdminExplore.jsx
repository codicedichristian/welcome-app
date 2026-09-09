import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { adminGetExploreCards, adminUpdateExploreCard, adminCreateExploreCard, adminDeleteExploreCard } from '../../lib/api.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import { Field, Input, Textarea } from '../../admin/components/FormField.jsx'
import ImageUploader from '../../components/admin/ImageUploader.jsx'
import { deeplTranslate } from '../../lib/deepl.js'

const COLOR_SWATCHES = [
  { name: 'Purple', hex: '#a78bfa' },
  { name: 'Blue',   hex: '#5b8cff' },
  { name: 'White',  hex: '#ffffff' },
  { name: 'Green',  hex: '#4caf7d' },
  { name: 'Orange', hex: '#f97316' },
]

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

function toFormState(card) {
  return {
    title:          card.title ?? '',
    title_en:       card.title_en ?? '',
    description:    card.description ?? '',
    description_en: card.description_en ?? '',
    image_url:      card.image_url ?? '',
    pill_label:     card.pill_label ?? '',
    pill_color:     card.pill_color ?? COLOR_SWATCHES[0].hex,
    order_index:    card.order_index ?? 0,
    active:         card.active ?? true,
    route:          card.route ?? '',
  }
}

function ExploreForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const [translating, setTranslating] = useState(null)
  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

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
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
      className="flex flex-col gap-3"
    >
      <Field label="Title">
        <div className="flex flex-col gap-2">
          <Input placeholder="Español" value={form.title} onChange={(e) => update({ title: e.target.value })} required />
          <div className="flex items-center gap-2">
            <Input placeholder="English" value={form.title_en} onChange={(e) => update({ title_en: e.target.value })} />
            <TranslateBtn onClick={() => translate('title', 'title_en')} loading={translating === 'title_en'} />
          </div>
        </div>
      </Field>

      <Field label="Route (app path)">
        <Input
          placeholder="e.g. /bienvenido"
          value={form.route}
          onChange={(e) => update({ route: e.target.value })}
          required
        />
      </Field>

      <Field label="Description">
        <div className="flex flex-col gap-2">
          <Textarea rows={2} placeholder="Español" value={form.description} onChange={(e) => update({ description: e.target.value })} />
          <div className="flex items-start gap-2">
            <Textarea rows={2} placeholder="English" value={form.description_en} onChange={(e) => update({ description_en: e.target.value })} />
            <TranslateBtn onClick={() => translate('description', 'description_en')} loading={translating === 'description_en'} />
          </div>
        </div>
      </Field>

      <ImageUploader
        folder="explore"
        imageUrl={form.image_url}
        onUpload={(url) => update({ image_url: url })}
        label="Card image"
      />

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
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

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
    if (isCreating) {
      await adminCreateExploreCard(form)
    } else {
      await adminUpdateExploreCard(editTarget.id, form)
    }
    setSaving(false)
    setEditTarget(null)
    setIsCreating(false)
    load()
  }

  async function handleDelete(card) {
    if (!window.confirm(`Delete "${card.title}"?`)) return
    setDeletingId(card.id)
    await adminDeleteExploreCard(card.id)
    setDeletingId(null)
    load()
  }

  const EMPTY_CARD = { title: '', title_en: '', description: '', description_en: '', image_url: '', pill_label: '', pill_color: COLOR_SWATCHES[0].hex, order_index: cards.length, active: true, route: '' }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-primary">Explore the Church</h1>
          <p className="mt-1 text-xs text-zinc-500">Drag to reorder — changes reflect immediately on the home screen</p>
        </div>
        <button
          type="button"
          onClick={() => { setIsCreating(true); setEditTarget(null) }}
          className="flex items-center gap-1.5 rounded-xl bg-accent-blue px-3 py-2 text-sm font-medium text-bg"
        >
          <Plus size={15} />
          New card
        </button>
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

              {/* Title + pill + route */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{card.title}</p>
                <p className="text-[11px] text-zinc-600 truncate">{card.route}</p>
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

              {/* Delete */}
              <button
                type="button"
                onClick={() => handleDelete(card)}
                disabled={deletingId === card.id}
                aria-label="Delete"
                className="shrink-0 text-zinc-600 transition-colors hover:text-red-500 disabled:opacity-40"
              >
                <Trash2 size={15} />
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={() => { setEditTarget(card); setIsCreating(false) }}
                aria-label="Edit"
                className="shrink-0 text-zinc-400 transition-colors hover:text-primary"
              >
                <Pencil size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(editTarget || isCreating) && (
        <Modal
          title={isCreating ? 'New card' : 'Edit card'}
          onClose={() => { setEditTarget(null); setIsCreating(false) }}
        >
          <ExploreForm
            initial={isCreating ? toFormState(EMPTY_CARD) : toFormState(editTarget)}
            onSave={handleSave}
            onCancel={() => { setEditTarget(null); setIsCreating(false) }}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  )
}
