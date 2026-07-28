import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { adminGetSundays, adminDeleteSummary, adminGetScheduleDates } from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'

export default function AdminSundays() {
  const navigate = useNavigate()
  const [sundays, setSundays] = useState([])
  const [scheduleDates, setScheduleDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = async () => {
    const [{ data: summaries, error: e }, { data: dates }] = await Promise.all([
      adminGetSundays(),
      adminGetScheduleDates(),
    ])
    if (e) setError(true)
    else {
      setSundays(summaries ?? [])
      setScheduleDates(dates ?? [])
      setError(false)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const summaryScheduleIds = useMemo(
    () => new Set(sundays.map((s) => s.schedule_id)),
    [sundays],
  )
  const availableDates = useMemo(
    () => scheduleDates.filter((d) => !summaryScheduleIds.has(d.id)),
    [scheduleDates, summaryScheduleIds],
  )

  const handleDelete = async () => {
    await adminDeleteSummary(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-primary">Sundays</h1>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-bg"
        >
          <Plus size={16} />
          <span>Add Sunday</span>
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
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">Title</th>
                <th className="px-4 py-3 font-normal">Speaker</th>
                <th className="px-4 py-3 font-normal">Scripture</th>
                <th className="px-4 py-3 font-normal">Video</th>
                <th className="px-4 py-3 font-normal">Photos</th>
                <th className="px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sundays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                    No Sunday summaries yet
                  </td>
                </tr>
              ) : (
                sundays.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-primary">{formatShortDate(s.schedule?.date)}</td>
                    <td className="px-4 py-3 text-zinc-400">{s.title || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">{s.speaker || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">{s.scripture || '—'}</td>
                    <td className="px-4 py-3">
                      {s.video_url ? (
                        <a
                          href={s.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#5b8cff]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.photos_url ? (
                        <a
                          href={s.photos_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#5b8cff]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/sundays/${s.schedule_id}`)}
                          aria-label="Edit"
                          className="text-zinc-400 transition-colors hover:text-primary"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          aria-label="Delete"
                          className="text-zinc-400 transition-colors hover:text-[#e55555]"
                        >
                          <Trash2 size={15} />
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

      {showPicker && (
        <Modal title="Select a date" onClose={() => setShowPicker(false)}>
          {availableDates.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No available dates — create a service schedule first under Schedules.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {availableDates.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { setShowPicker(false); navigate(`/admin/sundays/${d.id}`) }}
                  className="rounded-xl px-4 py-3 text-left text-sm text-primary transition-colors hover:bg-surface"
                >
                  {formatShortDate(d.date)}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowPicker(false)}
            className="mt-4 w-full rounded-xl border border-border py-2.5 text-sm text-primary"
          >
            Cancel
          </button>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Sunday"
          message={`Delete the Sunday summary for ${formatShortDate(deleteTarget.schedule?.date)}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
