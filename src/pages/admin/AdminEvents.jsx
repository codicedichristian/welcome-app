import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { adminGetEvents, adminCreateEvent, adminUpdateEvent, adminDeleteEvent } from '../../lib/api.js'
import { formatTime12h, capitalize } from '../../lib/format.js'
import { safeUrl, trimField } from '../../lib/sanitize.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { Field, Input, Textarea, Select } from '../../admin/components/FormField.jsx'
import ImageUploader from '../../components/admin/ImageUploader.jsx'
import { deeplTranslate } from '../../lib/deepl.js'

const TYPE_OPTIONS = ['sunday', 'youth', 'midweek', 'prayer', 'special']
const AUDIENCE_OPTIONS = ['Open to everyone', 'Members only', 'Youth', 'Women', 'Men', 'Leaders']
const LOCATION_TYPES = [
  { value: 'in_person', label: 'In person' },
  { value: 'online',   label: 'Online' },
  { value: 'other',    label: 'Other' },
]
const COLOR_SWATCHES = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Green', hex: '#4caf7d' },
  { name: 'Blue', hex: '#5b8cff' },
  { name: 'Purple', hex: '#a78bfa' },
  { name: 'Orange', hex: '#f97316' },
]
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const WEEKS = ['1st', '2nd', '3rd', '4th', 'last']

function parseRecurring(value) {
  if (!value || value === 'none') return { recur_freq: 'none', recur_day: 'sunday', recur_week: '1st' }
  if (value.startsWith('weekly_')) return { recur_freq: 'weekly', recur_day: value.slice(7), recur_week: '1st' }
  if (value.startsWith('monthly_')) {
    const parts = value.slice(8).split('_')
    return { recur_freq: 'monthly', recur_week: parts[0] ?? '1st', recur_day: parts[1] ?? 'sunday' }
  }
  return { recur_freq: 'none', recur_day: 'sunday', recur_week: '1st' }
}

function buildRecurring(recur_freq, recur_day, recur_week) {
  if (recur_freq === 'weekly') return `weekly_${recur_day}`
  if (recur_freq === 'monthly') return `monthly_${recur_week}_${recur_day}`
  return null
}

function detectLocationType(loc) {
  if (!loc) return 'in_person'
  if (loc.startsWith('http')) return 'online'
  return 'in_person'
}

const EMPTY_EVENT = {
  title_es: '',
  title_en: '',
  type: 'sunday',
  color: COLOR_SWATCHES[0].hex,
  description_es: '',
  description_en: '',
  location: '',
  location_type: 'in_person',
  audience: 'Open to everyone',
  recur_freq: 'none',
  recur_day: 'sunday',
  recur_week: '1st',
  event_date: '',
  start_time: '',
  end_time: '',
  image_url: '',
  link: '',
}

function toFormState(event) {
  const loc = event.location ?? ''
  const { recur_freq, recur_day, recur_week } = parseRecurring(event.recurring)
  const rawTitle = event.title ?? {}
  const rawDesc = event.description ?? {}
  return {
    title_es: (typeof rawTitle === 'string' ? rawTitle : (rawTitle.es ?? '')),
    title_en: (typeof rawTitle === 'object' ? (rawTitle.en ?? '') : ''),
    type: event.type ?? 'sunday',
    color: event.color ?? COLOR_SWATCHES[0].hex,
    description_es: (typeof rawDesc === 'string' ? rawDesc : (rawDesc.es ?? '')),
    description_en: (typeof rawDesc === 'object' ? (rawDesc.en ?? '') : ''),
    location: loc,
    location_type: detectLocationType(loc),
    audience: event.audience || 'Open to everyone',
    recur_freq,
    recur_day,
    recur_week,
    event_date: event.event_date ?? '',
    start_time: event.start_time?.slice(0, 5) ?? '',
    end_time: event.end_time?.slice(0, 5) ?? '',
    image_url: event.image_url ?? '',
    link: event.link ?? '',
  }
}

function toPayload(form) {
  const recurring = buildRecurring(form.recur_freq, form.recur_day, form.recur_week)
  return {
    title:       { es: trimField(form.title_es), en: trimField(form.title_en) },
    type:        form.type,
    color:       form.color,
    icon:        'cross',
    description: { es: trimField(form.description_es), en: trimField(form.description_en) },
    location:    trimField(form.location),
    audience:    trimField(form.audience),
    recurring,
    event_date:  form.recur_freq === 'none' ? form.event_date || null : null,
    start_time:  form.start_time || null,
    end_time:    form.end_time || null,
    image_url:   safeUrl(form.image_url),
    link:        trimField(form.link) || null,
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

function EventForm({ initial, onSave, onCancel, saving }) {
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
        onSave(toPayload(form))
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

      <Field label="Type">
        <Select value={form.type} onChange={(e) => update({ type: e.target.value })}>
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {capitalize(option)}
            </option>
          ))}
        </Select>
      </Field>

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

      <Field label="Description">
        <div className="flex flex-col gap-2">
          <Textarea rows={3} placeholder="Español" value={form.description_es} onChange={(e) => update({ description_es: e.target.value })} />
          <div className="flex items-start gap-2">
            <Textarea rows={3} placeholder="English" value={form.description_en} onChange={(e) => update({ description_en: e.target.value })} />
            <TranslateBtn onClick={() => translate('description_es', 'description_en')} loading={translating === 'description_en'} />
          </div>
        </div>
      </Field>

      <Field label="Location type">
        <Select
          value={form.location_type}
          onChange={(e) => update({ location_type: e.target.value, location: '' })}
        >
          {LOCATION_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </Field>

      <Field
        label={
          form.location_type === 'online' ? 'Zoom / platform link'
          : form.location_type === 'other' ? 'Description'
          : 'Address / place name'
        }
      >
        <Input
          value={form.location}
          onChange={(e) => update({ location: e.target.value })}
          type={form.location_type === 'online' ? 'url' : 'text'}
          placeholder={
            form.location_type === 'online' ? 'https://zoom.us/...'
            : form.location_type === 'other' ? 'e.g. Meeting room 2'
            : 'e.g. Calle Mayor 10, Madrid'
          }
        />
      </Field>

      <Field label="Audience">
        <Select value={form.audience} onChange={(e) => update({ audience: e.target.value })}>
          {AUDIENCE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Select>
      </Field>

      <Field label="Recurring">
        <Select value={form.recur_freq} onChange={(e) => update({ recur_freq: e.target.value })}>
          <option value="none">None (one-off)</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </Select>
      </Field>

      {form.recur_freq !== 'none' && (
        <Field label="Day of week">
          <Select value={form.recur_day} onChange={(e) => update({ recur_day: e.target.value })}>
            {DAYS.map((d) => (
              <option key={d} value={d}>{capitalize(d)}</option>
            ))}
          </Select>
        </Field>
      )}

      {form.recur_freq === 'monthly' && (
        <Field label="Week of month">
          <Select value={form.recur_week} onChange={(e) => update({ recur_week: e.target.value })}>
            {WEEKS.map((w) => (
              <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
            ))}
          </Select>
        </Field>
      )}

      {form.recur_freq === 'none' && (
        <Field label="Event date">
          <Input type="date" value={form.event_date} onChange={(e) => update({ event_date: e.target.value })} required />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start time">
          <Input type="time" value={form.start_time} onChange={(e) => update({ start_time: e.target.value })} />
        </Field>
        <Field label="End time">
          <Input type="time" value={form.end_time} onChange={(e) => update({ end_time: e.target.value })} />
        </Field>
      </div>

      <Field label="Link (optional)">
        <Input
          type="url"
          value={form.link}
          onChange={(e) => update({ link: e.target.value })}
          placeholder="https://..."
        />
      </Field>

      <ImageUploader
        folder="events"
        imageUrl={form.image_url}
        onUpload={(url) => update({ image_url: url })}
        label="Image"
      />

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

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalEvent, setModalEvent] = useState(null) // 'new' | event object | null
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data, error: apiError } = await adminGetEvents()
    if (apiError) {
      setError(true)
    } else {
      setEvents(data ?? [])
      setError(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    adminGetEvents().then(({ data, error: apiError }) => {
      if (cancelled) return
      if (apiError) {
        setError(true)
      } else {
        setEvents(data ?? [])
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
    const { error: apiError } =
      modalEvent === 'new' ? await adminCreateEvent(payload) : await adminUpdateEvent(modalEvent.id, payload)
    setSaving(false)

    if (!apiError) {
      setModalEvent(null)
      load()
    }
  }

  const handleDelete = async () => {
    const { error: apiError } = await adminDeleteEvent(deleteTarget.id)
    if (!apiError) {
      setDeleteTarget(null)
      load()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-primary">Events</h1>
        <button
          type="button"
          onClick={() => setModalEvent('new')}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-bg"
        >
          <Plus size={16} />
          <span>Add Event</span>
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-zinc-500">
                <th className="px-4 py-3 font-normal">Title</th>
                <th className="px-4 py-3 font-normal">Type</th>
                <th className="px-4 py-3 font-normal">Location</th>
                <th className="px-4 py-3 font-normal">Time</th>
                <th className="px-4 py-3 font-normal">Recurring</th>
                <th className="px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                    No events yet
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-primary">{event.title}</td>
                    <td className="px-4 py-3 text-zinc-400">{capitalize(event.type)}</td>
                    <td className="px-4 py-3 text-zinc-400">{event.location}</td>
                    <td className="px-4 py-3 text-zinc-400">{formatTime12h(event.start_time)}</td>
                    <td className="px-4 py-3 text-zinc-400">{event.recurring ? capitalize(event.recurring.replace(/_/g, ' ')) : event.event_date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setModalEvent(event)} aria-label="Edit" className="text-zinc-400 transition-colors hover:text-primary">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(event)} aria-label="Delete" className="text-zinc-400 transition-colors hover:text-[#e55555]">
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

      {modalEvent && (
        <Modal title={modalEvent === 'new' ? 'Add Event' : 'Edit Event'} onClose={() => setModalEvent(null)}>
          <EventForm
            initial={modalEvent === 'new' ? EMPTY_EVENT : toFormState(modalEvent)}
            onSave={handleSave}
            onCancel={() => setModalEvent(null)}
            saving={saving}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete event"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
