import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import { adminGetSchedules, adminCreateSchedules, adminDeleteSchedule } from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'

function getUpcomingSundays(count = 12) {
  const sundays = []
  const today = new Date()
  const daysUntilSunday = today.getDay() === 0 ? 0 : 7 - today.getDay()
  let next = new Date(today)
  next.setDate(today.getDate() + daysUntilSunday)
  for (let i = 0; i < count; i++) {
    sundays.push(next.toISOString().slice(0, 10))
    next = new Date(next)
    next.setDate(next.getDate() + 7)
  }
  return sundays
}

export default function AdminSchedules() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedDates, setSelectedDates] = useState([])
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = async () => {
    const { data, error: e } = await adminGetSchedules()
    if (e) setError(true)
    else { setSchedules(data ?? []); setError(false) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const upcomingSundays = getUpcomingSundays(12)
  const existingDates = new Set(schedules.map((s) => s.date))
  const availableSundays = upcomingSundays.filter((d) => !existingDates.has(d))

  const toggleDate = (date) => {
    setSelectedDates((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]))
  }

  const handleCreate = async () => {
    if (!selectedDates.length) return
    setCreating(true)
    await adminCreateSchedules(selectedDates)
    setCreating(false)
    setShowModal(false)
    setSelectedDates([])
    load()
  }

  const handleDelete = async () => {
    await adminDeleteSchedule(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-primary">Schedules</h1>
        <button
          type="button"
          onClick={() => { setSelectedDates([]); setShowModal(true) }}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-bg"
        >
          <Plus size={16} />
          <span>New Schedule</span>
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-zinc-500">
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">Sermon title</th>
                <th className="px-4 py-3 font-normal">Speaker</th>
                <th className="px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                    No schedules yet
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer border-b border-border last:border-b-0 transition-colors hover:bg-surface"
                    onClick={() => navigate(`/admin/schedules/${s.id}`)}
                  >
                    <td className="px-4 py-3 text-primary">{formatShortDate(s.date)}</td>
                    <td className="px-4 py-3 text-zinc-400">{s.schedule_summaries?.[0]?.title ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">{s.schedule_summaries?.[0]?.speaker ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(s) }}
                          aria-label="Delete"
                          className="text-zinc-400 transition-colors hover:text-[#e55555]"
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight size={16} className="text-zinc-600" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="New Sunday Schedule" onClose={() => setShowModal(false)}>
          <p className="mb-3 text-xs text-zinc-500">Select one or more Sundays to create schedules for.</p>
          {availableSundays.length === 0 ? (
            <p className="text-sm text-zinc-500">All upcoming Sundays already have schedules.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {availableSundays.map((date) => (
                <label
                  key={date}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface"
                >
                  <input
                    type="checkbox"
                    checked={selectedDates.includes(date)}
                    onChange={() => toggleDate(date)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-primary">{formatShortDate(date)}</span>
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || selectedDates.length === 0}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-bg disabled:opacity-60"
            >
              {creating ? 'Creating...' : `Create (${selectedDates.length})`}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete schedule"
          message={`Delete the schedule for ${formatShortDate(deleteTarget.date)}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
