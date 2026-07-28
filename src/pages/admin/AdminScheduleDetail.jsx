import { useEffect, useMemo, useState } from 'react'
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

const STATUS_STYLE = {
  accepted: { color: '#4caf7d', label: 'Accepted' },
  declined:  { color: '#e55555', label: 'Declined' },
  pending:   { color: '#666666', label: 'Pending' },
}

const EMPTY_FORM = { title: '', speaker: '', scripture: '', description: '', video_url: '', photos_url: '' }

function toForm(s) {
  if (!s) return EMPTY_FORM
  return {
    title:       s.title ?? '',
    speaker:     s.speaker ?? '',
    scripture:   s.scripture ?? '',
    description: s.description ?? '',
    video_url:   s.video_url ?? '',
    photos_url:  s.photos_url ?? '',
  }
}

function RosterTab({ scheduleId, areaId }) {
  const [roster, setRoster] = useState(null)

  useEffect(() => {
    if (!areaId) return
    setRoster(null)
    getScheduleRoster(scheduleId, areaId).then(({ data }) => setRoster(data ?? []))
  }, [scheduleId, areaId])

  if (roster === null) return <div className="mt-4"><Spinner /></div>

  const totals = {
    accepted: roster.filter((r) => r.status === 'accepted').length,
    declined:  roster.filter((r) => r.status === 'declined').length,
    pending:   roster.filter((r) => r.status === 'pending').length,
  }

  return (
    <div className="mt-4">
      <p className="mb-3 text-xs text-zinc-500">
        {totals.accepted} accepted · {totals.declined} declined · {totals.pending} pending
      </p>
      {roster.length === 0 ? (
        <p className="text-sm text-zinc-500">No one assigned to this area for this service.</p>
      ) : (
        <div className="space-y-2">
          {roster.map((entry) => {
            const st = STATUS_STYLE[entry.status] ?? STATUS_STYLE.pending
            return (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span className="text-sm text-primary">
                  {entry.users?.first_name} {entry.users?.last_name}
                </span>
                <span className="text-xs font-medium" style={{ color: st.color }}>{st.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminScheduleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [allAreas, setAllAreas] = useState([])
  const [activeMacro, setActiveMacro] = useState(0)
  const [activeSub, setActiveSub] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([adminGetSummary(id), adminGetServiceAreas()]).then(
      ([{ data: summary }, { data: areas }]) => {
        setForm(toForm(summary))
        setAllAreas(areas ?? [])
        setLoading(false)
      },
    )
  }, [id])

  const macroAreas = useMemo(() => allAreas.filter((a) => a.is_macro), [allAreas])
  const subAreas = useMemo(() => {
    const macro = macroAreas[activeMacro]
    if (!macro) return []
    return allAreas.filter((a) => a.parent_id === macro.id)
  }, [allAreas, macroAreas, activeMacro])

  const rosterAreaId = useMemo(() => {
    if (subAreas.length > 0) return subAreas[activeSub]?.id
    return macroAreas[activeMacro]?.id
  }, [macroAreas, subAreas, activeMacro, activeSub])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await adminUpsertSummary(id, form)
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
        Schedules
      </button>

      <h1 className="text-lg font-medium text-primary">Schedule Detail</h1>

      {/* Sermon form */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-primary">Sermon details</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
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
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save sermon details'}
          </button>
        </form>
      </section>

      {/* Service roster */}
      {macroAreas.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-primary">Service roster</h2>

          {/* Macro tabs */}
          <div className="flex gap-4 border-b border-border">
            {macroAreas.map((area, i) => (
              <button
                key={area.id}
                type="button"
                onClick={() => { setActiveMacro(i); setActiveSub(0) }}
                className={`pb-2 text-sm transition-colors ${
                  activeMacro === i
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-zinc-500 hover:text-primary'
                }`}
              >
                {area.name}
              </button>
            ))}
          </div>

          {/* Sub-tabs (e.g. Media / Sound under Production) */}
          {subAreas.length > 0 && (
            <div className="mt-2 flex gap-3 border-b border-border/50">
              {subAreas.map((area, i) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setActiveSub(i)}
                  className={`pb-1.5 text-xs transition-colors ${
                    activeSub === i ? 'border-b border-primary text-primary' : 'text-zinc-600 hover:text-primary'
                  }`}
                >
                  {area.name}
                </button>
              ))}
            </div>
          )}

          <RosterTab scheduleId={id} areaId={rosterAreaId} />
        </section>
      )}
    </div>
  )
}
