import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { exportToCSV } from '../../lib/exportCsv.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'

export default function AdminEventContactRequests() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    supabase
      .from('event_contact_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: e }) => {
        if (e) setError(true)
        else setRows(data ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorState />

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-primary">Event Contact Req.</h1>
          <p className="mt-1 text-xs text-zinc-500">{rows.length} total</p>
        </div>
        <button
          onClick={() => exportToCSV(
            rows.map(r => ({
              'Nome':     r.first_name ?? '',
              'Cognome':  r.last_name ?? '',
              'Telefono': r.phone ?? '',
              'Evento':   r.event_name ?? '',
              'Data':     r.created_at ? new Date(r.created_at).toLocaleDateString('es-ES') : '',
            })),
            'event-contact-requests.csv'
          )}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-zinc-400 hover:text-primary hover:border-zinc-500 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
        {rows.length === 0 ? (
          <p className="px-4 py-4 text-xs text-zinc-500">No requests yet</p>
        ) : (
          rows.map((r, i) => (
            <div key={r.id} className={`flex items-start justify-between gap-4 px-4 py-4 ${i !== rows.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">{r.first_name} {r.last_name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{r.phone}</p>
                {r.event_name && <p className="mt-1 text-xs text-accent-blue">{r.event_name}</p>}
              </div>
              <p className="shrink-0 text-xs text-zinc-500">
                {new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
