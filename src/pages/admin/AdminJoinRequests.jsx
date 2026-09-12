import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'

export default function AdminJoinRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error: apiError } = await supabase
        .from('team_join_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (apiError) { setError(true) } else { setRequests(data ?? []) }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorState />

  return (
    <div>
      <h1 className="text-lg font-medium text-primary">Join Requests</h1>
      <p className="mt-1 text-xs text-zinc-500">{requests.length} total requests</p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
        {requests.length === 0 ? (
          <p className="px-4 py-4 text-xs text-zinc-500">No requests yet</p>
        ) : (
          requests.map((req, index) => (
            <div
              key={req.id}
              className={`flex items-start justify-between gap-4 px-4 py-4 ${
                index !== requests.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">{req.full_name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{req.email}</p>
                {req.phone && (
                  <p className="mt-0.5 text-xs text-zinc-500">{req.phone}</p>
                )}
                {req.area_name && (
                  <p className="mt-1.5 text-xs text-accent-blue">{req.area_name}</p>
                )}
              </div>
              <p className="shrink-0 text-xs text-zinc-500">
                {new Date(req.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
