import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { adminGetAttendance, adminGetEventParticipants } from '../../lib/api.js'
import { getNextOccurrence } from '../../lib/events.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'

function formatEventDate(event) {
  const dateObj = getNextOccurrence(event)
  if (!dateObj) return '—'
  return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRsvpDate(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function ParticipantPanel({ event, onClose }) {
  const [participants, setParticipants] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    adminGetEventParticipants(event.id).then(({ data, error: apiError }) => {
      if (apiError) { setError(true) } else { setParticipants(data ?? []) }
      setLoading(false)
    })
  }, [event.id])

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50"
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-primary">{event.name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">Participants</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorState />
          ) : participants.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-zinc-500">No participants yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500">Email</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500">Phone</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500">RSVP date</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, i) => (
                  <tr
                    key={`${p.email}-${i}`}
                    className={`border-b border-border last:border-0`}
                  >
                    <td className="px-5 py-3 font-medium text-primary">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{p.email || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.phone || '—'}</td>
                    <td className="px-4 py-3 text-zinc-500">{formatRsvpDate(p.rsvped_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

export default function AdminAttendancePage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    adminGetAttendance().then(({ data, error: apiError }) => {
      if (apiError) { setError(true) } else { setEvents(data ?? []) }
      setLoading(false)
    })
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorState />

  return (
    <div>
      <h1 className="text-lg font-medium text-primary">Event Attendance</h1>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
        {events.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">No events found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-xs font-medium text-zinc-500">Event</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500">Date</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500">Participants</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-primary">{ev.title}</td>
                  <td className="px-4 py-3 text-zinc-400">{formatEventDate(ev)}</td>
                  <td className="px-4 py-3">
                    {ev.rsvp_count > 0 ? (
                      <span className="rounded-full bg-accent-green/10 px-2.5 py-0.5 text-xs font-medium text-accent-green">
                        {ev.rsvp_count} going
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(ev)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-white/5"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedEvent && (
        <ParticipantPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}
