import { Fragment, useEffect, useMemo, useState } from 'react'
import { Search, Download, ChevronDown } from 'lucide-react'
import { adminGetMembers } from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'

function toCsv(members) {
  const headers = ['First name', 'Last name', 'Email', 'Phone', 'Age range', 'Interests', 'Joined']
  const rows = members.map((member) => [
    member.first_name,
    member.last_name,
    member.email,
    member.phone ?? '',
    member.age_range ?? '',
    (member.interests ?? []).join('; '),
    member.created_at,
  ])

  return [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function AdminMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error: apiError } = await adminGetMembers()
      if (cancelled) return

      if (apiError) {
        setError(true)
      } else {
        setMembers(data ?? [])
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return members

    return members.filter((member) => {
      const name = `${member.first_name ?? ''} ${member.last_name ?? ''}`.toLowerCase()
      return name.includes(query) || member.email?.toLowerCase().includes(query)
    })
  }, [members, search])

  const handleExport = () => downloadCsv(toCsv(filtered), 'members.csv')

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-medium text-primary">Members</h1>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-sm text-primary"
        >
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5">
        <Search size={16} className="text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full bg-transparent text-sm text-primary placeholder-zinc-600 outline-none"
        />
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
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Phone</th>
                <th className="px-4 py-3 font-normal">Age range</th>
                <th className="px-4 py-3 font-normal">Joined</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                    No members found
                  </td>
                </tr>
              ) : (
                filtered.map((member) => {
                  const expanded = expandedId === member.id
                  return (
                    <Fragment key={member.id}>
                      <tr className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3 text-primary">
                          {member.first_name} {member.last_name}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{member.email}</td>
                        <td className="px-4 py-3 text-zinc-400">{member.phone || '—'}</td>
                        <td className="px-4 py-3 text-zinc-400">{member.age_range || '—'}</td>
                        <td className="px-4 py-3 text-zinc-400">{formatShortDate(member.created_at?.slice(0, 10))}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : member.id)}
                            aria-label="Toggle details"
                            className="text-zinc-400 transition-colors hover:text-primary"
                          >
                            <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-b border-border bg-bg last:border-b-0">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                              <div>
                                <p className="text-zinc-500">Role</p>
                                <p className="mt-0.5 text-primary">{member.role ?? 'member'}</p>
                              </div>
                              <div>
                                <p className="text-zinc-500">Interests</p>
                                <p className="mt-0.5 text-primary">{(member.interests ?? []).join(', ') || '—'}</p>
                              </div>
                              <div>
                                <p className="text-zinc-500">Notifications</p>
                                <p className="mt-0.5 text-primary">
                                  {Object.entries(member.notifications ?? {})
                                    .filter(([, value]) => value)
                                    .map(([key]) => key)
                                    .join(', ') || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-zinc-500">Member ID</p>
                                <p className="mt-0.5 truncate text-primary">{member.id}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
