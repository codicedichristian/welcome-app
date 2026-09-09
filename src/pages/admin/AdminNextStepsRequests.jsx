import { useEffect, useState } from 'react'
import { adminGetNextStepsRequests } from '../../lib/api.js'
import Spinner from '../../components/Spinner.jsx'

function fmt(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminNextStepsRequests() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminGetNextStepsRequests().then(({ data }) => {
      setRows(data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <h1 className="text-lg font-medium text-primary mb-4">Next Steps Requests</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No requests yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-[#1a1a1a] p-4 flex flex-col gap-1">
              <p className="text-sm font-semibold text-primary">{r.full_name}</p>
              {r.email && <p className="text-xs text-zinc-400">{r.email}</p>}
              {r.phone && <p className="text-xs text-zinc-400">{r.phone}</p>}
              <p className="text-[11px] text-zinc-600 mt-1">{fmt(r.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
