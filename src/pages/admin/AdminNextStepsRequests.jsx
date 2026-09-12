import { useEffect, useState } from 'react'
import { adminGetNextStepsRequests } from '../../lib/api.js'
import Spinner from '../../components/Spinner.jsx'
import { exportToCSV } from '../../lib/exportCsv.js'

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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-primary">Next Steps Requests</h1>
        <button
          type="button"
          onClick={() => exportToCSV(
            rows.map(r => ({
              'Nome':     r.full_name ?? '',
              'Telefono': r.phone ?? '',
              'Email':    r.email ?? '',
            })),
            'next-steps-requests.csv'
          )}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-bg"
        >
          Export CSV
        </button>
      </div>
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
