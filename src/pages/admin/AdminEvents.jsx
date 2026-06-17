import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { adminGetEvents, adminCreateEvent, adminUpdateEvent, adminDeleteEvent } from '../../lib/api.js'
import { formatTime12h, capitalize } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { Field, Input, Textarea, Select } from '../../admin/components/FormField.jsx'

const TYPE_OPTIONS = ['sunday', 'youth', 'midweek', 'prayer', 'special']
const ICON_OPTIONS = ['cross', 'bolt', 'home', 'hands', 'star']
const COLOR_SWATCHES = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Green', hex: '#4caf7d' },
  { name: 'Blue', hex: '#5b8cff' },
  { name: 'Purple', hex: '#a78bfa' },
  { name: 'Orange', hex: '#f97316' },
]
const RECURRING_OPTIONS = [
  { value: 'none', label: 'None (one-off)' },
  { value: 'weekly_sunday', label: 'Weekly (Sunday)' },
  { value: 'weekly_monday', label: 'Weekly (Monday)' },
  { value: 'weekly_wednesday', label: 'Weekly (Wednesday)' },
  { value: 'biweekly_sunday', label: 'Biweekly (Sunday)' },
]

const EMPTY_EVENT = {
  title: '',
  type: 'sunday',
  color: COLOR_SWATCHES[0].hex,
  icon: ICON_OPTIONS[0],
  description: '',
  location: '',
  audience: '',
  recurring: 'none',
  event_date: '',
  start_time: '',
  end_time: '',
}

function toFormState(event) {
  return {
    title: event.title ?? '',
    type: event.type ?? 'sunday',
    color: event.color ?? COLOR_SWATCHES[0].hex,
    icon: event.icon ?? ICON_OPTIONS[0],
    description: event.description ?? '',
    location: event.location ?? '',
    audience: event.audience ?? '',
    recurring: event.recurring ?? 'none',
    event_date: event.event_date ?? '',
    start_time: event.start_time?.slice(0, 5) ?? '',
    end_time: event.end_time?.slice(0, 5) ?? '',
  }
}

function toPayload(form) {
  return {
    title: form.title,
    type: form.type,
    color: form.color,
    icon: form.icon,
    description: form.description,
    location: form.location,
    audience: form.audience,
    recurring: form.recurring === 'none' ? null : form.recurring,
    event_date: form.recurring === 'none' ? form.event_date || null : null,
    start_time: form.start_time || null,
    end_time: form.end_time || null,
  }
}

function EventForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(toPayload(form))
      }}
      className="flex flex-col gap-3"
    >
      <Field label="Title">
        <Input value={form.title} onChange={(e) => update({ title: e.target.value })} required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={form.type} onChange={(e) => update({ type: e.target.value })}>
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {capitalize(option)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Icon">
          <Select value={form.icon} onChange={(e) => update({ icon: e.target.value })}>
            {ICON_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {capitalize(option)}
              </option>
            ))}
          </Select>
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

      <Field label="Description">
        <Textarea rows={3} value={form.description} onChange={(e) => update({ description: e.target.value })} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Location">
          <Input value={form.location} onChange={(e) => update({ location: e.target.value })} />
        </Field>
        <Field label="Audience">
          <Input value={form.audience} onChange={(e) => update({ audience: e.target.value })} />
        </Field>
      </div>

      <Field label="Recurring">
        <Select value={form.recurring} onChange={(e) => update({ recurring: e.target.value })}>
          {RECURRING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      {form.recurring === 'none' && (
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
