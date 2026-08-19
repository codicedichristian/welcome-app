import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Save } from 'lucide-react'
import { adminGetSummary, adminUpsertSummary, adminGetScheduleDates } from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import { safeUrl, trimField } from '../../lib/sanitize.js'
import Spinner from '../../components/Spinner.jsx'
import { Field, Input, Textarea } from '../../admin/components/FormField.jsx'

const EMPTY_FORM = { title: '', speaker: '', scripture: '', description: '', video_url: '', photos_url: '', audio_url: '' }

function toForm(s) {
  if (!s) return EMPTY_FORM
  return {
    title:       s.title ?? '',
    speaker:     s.speaker ?? '',
    scripture:   s.scripture ?? '',
    description: s.description ?? '',
    video_url:   s.video_url ?? '',
    photos_url:  s.photos_url ?? '',
    audio_url:   s.audio_url ?? '',
  }
}

export default function AdminSundayDetail() {
  const { scheduleId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [scheduleDate, setScheduleDate] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([adminGetSummary(scheduleId), adminGetScheduleDates()]).then(
      ([{ data: summary }, { data: dates }]) => {
        setForm(toForm(summary))
        const match = (dates ?? []).find((d) => d.id === scheduleId)
        setScheduleDate(match?.date ?? null)
        setLoading(false)
      },
    )
  }, [scheduleId])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      title:       trimField(form.title),
      speaker:     trimField(form.speaker),
      scripture:   trimField(form.scripture),
      description: trimField(form.description),
      video_url:   safeUrl(form.video_url),
      photos_url:  safeUrl(form.photos_url),
      audio_url:   safeUrl(form.audio_url),
    }
    await adminUpsertSummary(scheduleId, payload)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/admin/sundays')}
        className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
        Sundays
      </button>

      <h1 className="text-lg font-medium text-primary">
        {scheduleDate ? formatShortDate(scheduleDate) : 'Sunday Detail'}
      </h1>

      <form onSubmit={handleSave} className="mt-5 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => update({ title: e.target.value })} />
          </Field>
          <Field label="Speaker">
            <Input value={form.speaker} onChange={(e) => update({ speaker: e.target.value })} />
          </Field>
        </div>
        <Field label="Scripture">
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
            placeholder="https://…"
          />
        </Field>
        <Field label="Audio / Podcast URL (optional)">
          <Input
            type="url"
            value={form.audio_url}
            onChange={(e) => update({ audio_url: e.target.value })}
            placeholder="https://…"
          />
        </Field>
        <Field label="Photos URL">
          <Input
            type="url"
            value={form.photos_url}
            onChange={(e) => update({ photos_url: e.target.value })}
            placeholder="https://…"
          />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-bg disabled:opacity-60"
        >
          <Save size={15} />
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
        </button>
      </form>
    </div>
  )
}
