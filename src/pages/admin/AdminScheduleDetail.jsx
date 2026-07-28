import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Save } from 'lucide-react'
import {
  adminGetSummary,
  adminUpsertSummary,
  adminGetServiceAreas,
  getScheduleRoster,
} from '../../lib/api.js'
import Spinner from '../../components/Spinner.jsx'
import { Field, Input, Textarea } from '../../admin/components/FormField.jsx'

const EMPTY_FORM = { title: '', speaker: '', scripture: '', description: '', video_url: '', photo_urls: '' }

function toForm(summary) {
  if (!summary) return EMPTY_FORM
  return {
    title: summary.title ?? '',
    speaker: summary.speaker ?? '',
    scripture: summary.scripture ?? '',
    description: summary.description ?? '',
    video_url: summary.video_url ?? '',
    photo_urls: (summary.photo_urls ?? []).join('\n'),
  }
}

function toPayload(form) {
  return {
    title: form.title,
    speaker: form.speaker,
    scripture: form.scripture,
    description: form.description,
    video_url: form.video_url || null,
    photo_urls: form.photo_urls
      ? form.photo_urls.split('\n').map((l) => l.trim()).filter(Boolean)
      : [],
  }
}

function RosterTab({ scheduleId, area }) {
  const [roster, setRoster] = useState(null)

  useEffect(() => {
    getScheduleRoster(scheduleId, area.id).then(({ data }) => setRoster(data ?? []))
  }, [scheduleId, area.id])

  if (roster === null) return <div className="mt-4"><Spinner /></div>

  if (roster.length === 0) {
    return <p className="mt-4 text-sm text-zinc-500">No one assigned to {area.name} for this service.</p>
  }

  return (
    <div className="mt-4 space-y-2">
      {roster.map((entry) => (
        <div key={entry.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-primary">
            {entry.users?.first_name} {entry.users?.last_name}
          </span>
          <span className="text-xs text-zinc-500">{entry.users?.role}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminScheduleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [serviceAreas, setServiceAreas] = useState([])
  const [activeTab, setActiveTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([adminGetSummary(id), adminGetServiceAreas()]).then(
      ([{ data: summaryData }, { data: areasData }]) => {
        setForm(toForm(summaryData))
        setServiceAreas(areasData ?? [])
        setLoading(false)
      },
    )
  }, [id])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await adminUpsertSummary(id, toPayload(form))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/admin/schedules')}
        className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
        <span>Schedules</span>
      </button>

      <h1 className="text-lg font-medium text-primary">Schedule Detail</h1>
      <p className="mt-0.5 text-sm text-zinc-500">Sunday service</p>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-primary">Sermon details</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sermon title">
              <Input value={form.title} onChange={(e) => update({ title: e.target.value })} />
            </Field>
            <Field label="Speaker">
              <Input value={form.speaker} onChange={(e) => update({ speaker: e.target.value })} />
            </Field>
          </div>
          <Field label="Scripture reference">
            <Input
              value={form.scripture}
              onChange={(e) => update({ scripture: e.target.value })}
              placeholder="e.g. John 3:16"
            />
          </Field>
          <Field label="Description">
            <Textarea rows={4} value={form.description} onChange={(e) => update({ description: e.target.value })} />
          </Field>
          <Field label="Video URL">
            <Input
              type="url"
              value={form.video_url}
              onChange={(e) => update({ video_url: e.target.value })}
              placeholder="https://..."
            />
          </Field>
          <Field label="Photo URLs (one per line)">
            <Textarea
              rows={3}
              value={form.photo_urls}
              onChange={(e) => update({ photo_urls: e.target.value })}
              placeholder="https://..."
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-bg disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save sermon details'}
          </button>
        </form>
      </section>

      {serviceAreas.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-primary">Service roster</h2>
          <div className="flex gap-4 border-b border-border">
            {serviceAreas.map((area, i) => (
              <button
                key={area.id}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`pb-2 text-sm transition-colors ${
                  activeTab === i
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-zinc-500 hover:text-primary'
                }`}
              >
                {area.name}
              </button>
            ))}
          </div>
          <RosterTab scheduleId={id} area={serviceAreas[activeTab]} />
        </section>
      )}
    </div>
  )
}
