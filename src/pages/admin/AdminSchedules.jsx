import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import { adminGetSchedules, adminCreateSchedules, adminDeleteSchedule } from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function MonthCalendar({ selectedDates, onToggle, existingDates }) {
  const [view, setView] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const firstOfMonth = new Date(view.year, view.month, 1)
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const startOffset = (firstOfMonth.getDay() + 6) % 7 // Monday-first
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const shift = (delta) =>
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const monthLabel = firstOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} className="rounded-lg p-1 text-zinc-400 hover:text-primary">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium capitalize text-primary">{monthLabel}</span>
        <button type="button" onClick={() => shift(1)} className="rounded-lg p-1 text-zinc-400 hover:text-primary">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-xs text-zinc-600">
        {WEEK_DAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const date = new Date(view.year, view.month, day)
          const isSunday = date.getDay() === 0
          const dateStr = date.toISOString().slice(0, 10)
          const isSelected = selectedDates.includes(dateStr)
          const exists = existingDates.has(dateStr)

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isSunday || exists}
              onClick={() => isSunday && !exists && onToggle(dateStr)}
              className={`rounded-lg py-1.5 text-xs transition-colors ${
                !isSunday
                  ? 'cursor-default text-zinc-700'
                  : exists
                    ? 'cursor-default text-zinc-600'
                    : isSelected
                      ? 'bg-primary font-semibold text-bg'
                      : 'cursor-pointer font-medium text-primary hover:bg-surface'
              }`}
            >
              {day}
              {exists && <span className="block text-[8px] leading-none text-zinc-600">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminSchedules() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedDates, setSelectedDates] = useState([])
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = async () => {
    const { data, error: e } = await adminGetSchedules()
    if (e) setError(true)
    else { setSchedules(data ?? []); setError(false) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const existingDates = useMemo(() => new Set(schedules.map((s) => s.date)), [schedules])

  const handleToggle = (dateStr) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr],
    )
  }

  const handleCreate = async () => {
    if (!selectedDates.length) return
    setCreating(true)
    const { data, assignmentCount } = await adminCreateSchedules(selectedDates)
    setCreating(false)
    setSelectedDates([])
    const count = data?.length ?? 0
    setToast(
      `${count} schedule${count !== 1 ? 's' : ''} created, ${assignmentCount * count} pending responses generated`,
    )
    setTimeout(() => setToast(null), 4000)
    load()
  }

  const handleDelete = async () => {
    await adminDeleteSchedule(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <div>
      <h1 className="mb-5 text-lg font-medium text-primary">Schedules</h1>

      <div className="max-w-xs">
        <MonthCalendar
          selectedDates={selectedDates}
          onToggle={handleToggle}
          existingDates={existingDates}
        />
      </div>

      {selectedDates.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[...selectedDates].sort().map((d) => (
            <span
              key={d}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-primary"
            >
              {formatShortDate(d)}
              <button
                type="button"
                onClick={() => handleToggle(d)}
                className="text-zinc-500 hover:text-[#e55555]"
                aria-label={`Remove ${d}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {selectedDates.length > 0 && (
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="mt-3 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
        >
          <Plus size={15} />
          {creating
            ? 'Creating…'
            : `Create ${selectedDates.length} schedule${selectedDates.length !== 1 ? 's' : ''}`}
        </button>
      )}

      {toast && (
        <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-primary">
          {toast}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-zinc-500">
                  <th className="px-4 py-3 font-normal">Date</th>
                  <th className="px-4 py-3 font-normal">Sermon</th>
                  <th className="px-4 py-3 font-normal">Accepted</th>
                  <th className="px-4 py-3 font-normal">Declined</th>
                  <th className="px-4 py-3 font-normal">Pending</th>
                  <th className="px-4 py-3 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                      No schedules yet — pick Sundays above
                    </td>
                  </tr>
                ) : (
                  schedules.map((s) => {
                    const responses = s.service_responses ?? []
                    const accepted = responses.filter((r) => r.status === 'accepted').length
                    const declined = responses.filter((r) => r.status === 'declined').length
                    const pending = responses.filter((r) => r.status === 'pending').length
                    const sermon = s.sunday_summaries?.[0]?.title

                    return (
                      <tr
                        key={s.id}
                        className="cursor-pointer border-b border-border last:border-b-0 transition-colors hover:bg-surface"
                        onClick={() => navigate(`/admin/schedules/${s.id}`)}
                      >
                        <td className="px-4 py-3 text-primary">{formatShortDate(s.date)}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {sermon ?? <span className="text-zinc-600">Add sermon →</span>}
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: '#4caf7d' }}>{accepted}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: '#e55555' }}>{declined}</td>
                        <td className="px-4 py-3 text-zinc-500">{pending}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(s) }}
                              aria-label="Delete"
                              className="text-zinc-400 transition-colors hover:text-[#e55555]"
                            >
                              <Trash2 size={15} />
                            </button>
                            <ChevronRight size={15} className="text-zinc-600" />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete schedule"
          message={`Delete the schedule for ${formatShortDate(deleteTarget.date)}? All responses will also be deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
