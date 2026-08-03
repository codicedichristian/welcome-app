import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import {
  adminGetServiceAreas,
  adminGetScheduleDates,
  getScheduleRoster,
  adminUpdateSchedule,
  adminUpsertAreaNote,
  adminGetAreaNotes,
} from '../../lib/api.js'
import { getStoredUser } from '../../lib/user.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'

const STATUS_STYLE = {
  accepted: { color: '#4caf7d', label: 'Accepted' },
  declined:  { color: '#e55555', label: 'Declined' },
  pending:   { color: '#666666', label: 'Pending' },
}

const inputCls = 'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-primary placeholder-zinc-600 outline-none focus:border-zinc-500'
const labelCls = 'mb-1 block text-xs text-zinc-500'

// ─── Area Notes section ───────────────────────────────────────────────────────

function AreaNotesSection({ scheduleId, areaId, initial, authorId }) {
  const [text, setText] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setText(initial ?? '') }, [initial])

  const handleSave = async () => {
    setSaving(true)
    await adminUpsertAreaNote(scheduleId, areaId, authorId, text)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mt-4 rounded-xl border border-border p-3">
      <p className="mb-2 text-xs text-zinc-500">Team Notes</p>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false) }}
        placeholder="Add notes for your team…"
        rows={3}
        className="w-full resize-none bg-transparent text-sm text-primary placeholder-zinc-600 outline-none"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-xs text-zinc-400 transition-colors hover:text-primary disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save notes'}
        </button>
      </div>
    </div>
  )
}

// ─── Roster + area notes tab ─────────────────────────────────────────────────

function RosterTab({ scheduleId, areaId, areaNoteInitial, authorId }) {
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

      {areaId && (
        <AreaNotesSection
          scheduleId={scheduleId}
          areaId={areaId}
          initial={areaNoteInitial}
          authorId={authorId}
        />
      )}
    </div>
  )
}

// ─── General info card ────────────────────────────────────────────────────────

function GeneralInfoCard({ schedule, scheduleId }) {
  const [form, setForm] = useState({
    title: schedule?.title ?? '',
    arrival_time: schedule?.arrival_time ?? '',
    notes: schedule?.notes ?? '',
    document_url: schedule?.document_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({
      title: schedule?.title ?? '',
      arrival_time: schedule?.arrival_time ?? '',
      notes: schedule?.notes ?? '',
      document_url: schedule?.document_url ?? '',
    })
  }, [schedule])

  const set = (k) => (e) => { setForm((prev) => ({ ...prev, [k]: e.target.value })); setSaved(false) }

  const handleSave = async () => {
    setSaving(true)
    await adminUpdateSchedule(scheduleId, {
      title: form.title || null,
      arrival_time: form.arrival_time || null,
      notes: form.notes || null,
      document_url: form.document_url || null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">General Info</p>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Title</label>
          <input className={inputCls} value={form.title} onChange={set('title')} placeholder="Sunday Service" />
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <p className="text-sm text-primary">{formatShortDate(schedule?.date)}</p>
        </div>
        <div>
          <label className={labelCls}>Arrival time</label>
          <input className={inputCls} type="time" value={form.arrival_time} onChange={set('arrival_time')} />
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            className={`${inputCls} resize-none`}
            value={form.notes}
            onChange={set('notes')}
            placeholder="General notes for the team…"
            rows={3}
          />
        </div>
        <div>
          <label className={labelCls}>Document URL</label>
          <div className="flex gap-2">
            <input className={inputCls} value={form.document_url} onChange={set('document_url')} placeholder="https://…" />
            {form.document_url && (
              <a
                href={form.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center text-zinc-400 hover:text-primary"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl border border-border px-4 py-1.5 text-sm text-primary transition-colors hover:bg-surface disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminScheduleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const authorId = getStoredUser()?.id
  const [loading, setLoading] = useState(true)
  const [schedule, setSchedule] = useState(null)
  const [allAreas, setAllAreas] = useState([])
  const [areaNoteMap, setAreaNoteMap] = useState({})
  const [activeMacro, setActiveMacro] = useState(0)
  const [activeSub, setActiveSub] = useState(0)

  useEffect(() => {
    Promise.all([adminGetServiceAreas(), adminGetScheduleDates(), adminGetAreaNotes(id)]).then(
      ([{ data: areas }, { data: dates }, { data: notes }]) => {
        setAllAreas(areas ?? [])
        setSchedule((dates ?? []).find((d) => d.id === id) ?? null)
        const map = {}
        for (const n of notes ?? []) map[n.area_id] = n.notes ?? ''
        setAreaNoteMap(map)
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

      <h1 className="text-lg font-medium text-primary">
        {schedule ? `Service Roster — ${formatShortDate(schedule.date)}` : 'Service Roster'}
      </h1>

      <GeneralInfoCard schedule={schedule} scheduleId={id} />

      {macroAreas.length > 0 ? (
        <section className="mt-6">
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

          <RosterTab
            key={rosterAreaId}
            scheduleId={id}
            areaId={rosterAreaId}
            areaNoteInitial={areaNoteMap[rosterAreaId]}
            authorId={authorId}
          />
        </section>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">No service areas configured.</p>
      )}
    </div>
  )
}
