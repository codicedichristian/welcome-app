import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import {
  adminGetScheduleDates,
  adminUpdateSchedule,
  adminUpsertAreaNote,
  adminGetAreaNotes,
  adminGetScheduleRoster,
} from '../../lib/api.js'
import { getStoredUser } from '../../lib/user.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'

const STATUS_STYLE = {
  accepted: { color: '#4caf7d', label: 'Accepted' },
  declined:  { color: '#e05b4f', label: 'Declined' },
  pending:   { color: '#6b6b68', label: 'Pending' },
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
  const [rosterByArea, setRosterByArea] = useState({})
  const [flatAreas, setFlatAreas] = useState([])
  const [areaNoteMap, setAreaNoteMap] = useState({})
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    Promise.all([adminGetScheduleDates(), adminGetAreaNotes(id), adminGetScheduleRoster(id)]).then(
      ([{ data: dates }, { data: notes }, { data: roster }]) => {
        setSchedule((dates ?? []).find((d) => d.id === id) ?? null)
        const noteMap = {}
        for (const n of notes ?? []) noteMap[n.area_id] = n.notes ?? ''
        setAreaNoteMap(noteMap)
        setRosterByArea(roster ?? {})
        const areas = Object.entries(roster ?? {})
          .map(([areaId, { areaName }]) => ({ areaId, areaName }))
          .sort((a, b) => a.areaName.localeCompare(b.areaName))
        setFlatAreas(areas)
        setLoading(false)
      },
    )
  }, [id])

  if (loading) return <Spinner />

  const activeArea = flatAreas[activeIdx]
  const activeRoster = activeArea ? (rosterByArea[activeArea.areaId] ?? { members: [] }) : { members: [] }
  const { members } = activeRoster
  const totals = {
    accepted: members.filter((m) => m.status === 'accepted').length,
    declined:  members.filter((m) => m.status === 'declined').length,
    pending:   members.filter((m) => m.status === 'pending').length,
  }

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

      {flatAreas.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No responses recorded for this schedule.</p>
      ) : (
        <section className="mt-6">
          {/* ── Flat area tabs ── */}
          <div className="flex gap-4 overflow-x-auto border-b border-border pb-0">
            {flatAreas.map((area, i) => (
              <button
                key={area.areaId}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 pb-2 text-sm transition-colors ${
                  activeIdx === i
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-zinc-500 hover:text-primary'
                }`}
              >
                {area.areaName}
              </button>
            ))}
          </div>

          {/* ── Roster table ── */}
          <div className="mt-4">
            <p className="mb-3 text-xs text-zinc-500">
              {totals.accepted} accepted · {totals.declined} declined · {totals.pending} pending
            </p>

            {members.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">No members assigned to this area</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-zinc-500">
                      <th className="px-4 py-2.5 font-normal">Name</th>
                      <th className="px-4 py-2.5 font-normal">Status</th>
                      <th className="px-4 py-2.5 font-normal">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, i) => {
                      const st = STATUS_STYLE[m.status] ?? STATUS_STYLE.pending
                      return (
                        <tr key={i} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-3 text-primary">{m.name}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium" style={{ color: st.color }}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs italic text-zinc-500">
                            {m.status === 'declined' && m.declineReason ? m.declineReason : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeArea && (
              <AreaNotesSection
                scheduleId={id}
                areaId={activeArea.areaId}
                initial={areaNoteMap[activeArea.areaId]}
                authorId={authorId}
              />
            )}
          </div>
        </section>
      )}
    </div>
  )
}
