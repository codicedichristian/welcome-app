import { Fragment, useEffect, useMemo, useState } from 'react'
import { Search, Download, ChevronDown, X, Crown } from 'lucide-react'
import {
  adminGetMembers,
  adminUpdateUserRole,
  adminGetServiceAreas,
  adminGetUserServiceAssignments,
  adminAssignServiceArea,
  adminRemoveServiceArea,
  adminAssignAreaLeader,
  adminRemoveAreaLeader,
  adminAssignMidweekLeader,
  adminGetMidweekGroups,
} from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'

const ROLE_OPTIONS = ['member', 'volunteer', 'leader', 'admin']
const ROLE_STYLE = {
  member:    { bg: 'rgba(255,255,255,0.06)', color: '#888888', border: 'transparent' },
  volunteer: { bg: 'rgba(91,140,255,0.12)',  color: '#5b8cff', border: 'rgba(91,140,255,0.3)' },
  leader:    { bg: 'rgba(76,175,125,0.12)',  color: '#4caf7d', border: 'rgba(76,175,125,0.3)' },
  admin:     { bg: 'rgba(249,115,22,0.12)',  color: '#f97316', border: 'rgba(249,115,22,0.3)' },
}

function toCsv(members) {
  const headers = ['First name', 'Last name', 'Email', 'Phone', 'Age range', 'Role', 'Joined']
  const rows = members.map((m) => [
    m.first_name, m.last_name, m.email, m.phone ?? '', m.age_range ?? '', m.role ?? 'member', m.created_at,
  ])
  return [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
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

function RoleSelect({ memberId, currentRole, onRoleChange }) {
  const [saving, setSaving] = useState(false)
  const style = ROLE_STYLE[currentRole] ?? ROLE_STYLE.member

  const handleChange = async (e) => {
    const newRole = e.target.value
    setSaving(true)
    await adminUpdateUserRole(memberId, newRole)
    setSaving(false)
    onRoleChange(memberId, newRole)
  }

  return (
    <select
      value={currentRole ?? 'member'}
      onChange={handleChange}
      disabled={saving}
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: 8,
        padding: '4px 8px',
        fontSize: 12,
        outline: 'none',
        cursor: 'pointer',
        opacity: saving ? 0.6 : 1,
      }}
    >
      {ROLE_OPTIONS.map((r) => (
        <option key={r} value={r} style={{ background: '#1a1a1a', color: '#fff' }}>
          {r}
        </option>
      ))}
    </select>
  )
}

function MemberDetails({ member, serviceAreas, midweekGroups }) {
  const [assignments, setAssignments] = useState(null)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    adminGetUserServiceAssignments(member.id).then(({ data }) => setAssignments(data ?? []))
  }, [member.id])

  const assignedAreaIds = useMemo(() => new Set((assignments ?? []).map((a) => a.area_id)), [assignments])
  const unassignedAreas = useMemo(
    () => serviceAreas.filter((a) => !assignedAreaIds.has(a.id)),
    [serviceAreas, assignedAreaIds],
  )

  const handleAddArea = async (areaId) => {
    setSaving(areaId)
    const { data } = await adminAssignServiceArea(member.id, areaId)
    if (data) setAssignments((prev) => [...(prev ?? []), data])
    setSaving(null)
  }

  const handleRemoveArea = async (areaId) => {
    setSaving(areaId)
    await adminRemoveServiceArea(member.id, areaId)
    setAssignments((prev) => (prev ?? []).filter((a) => a.area_id !== areaId))
    setSaving(null)
  }

  const handleToggleLeader = async (assignment) => {
    setSaving(assignment.area_id)
    if (assignment.is_leader) {
      const { data } = await adminRemoveAreaLeader(member.id, assignment.area_id)
      if (data) setAssignments((prev) => (prev ?? []).map((a) => (a.area_id === assignment.area_id ? { ...a, is_leader: false } : a)))
    } else {
      const { data } = await adminAssignAreaLeader(member.id, assignment.area_id)
      if (data) setAssignments((prev) => (prev ?? []).map((a) => (a.area_id === assignment.area_id ? { ...a, is_leader: true } : a)))
    }
    setSaving(null)
  }

  return (
    <tr className="border-b border-border bg-bg last:border-b-0">
      <td colSpan={5} className="px-4 py-4">
        <div className="grid gap-4 text-xs sm:grid-cols-2">
          <div>
            <p className="mb-2 text-zinc-500">Service areas</p>
            {assignments === null ? (
              <p className="text-zinc-600">Loading...</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {assignments.map((a) => (
                  <span
                    key={a.area_id}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc' }}
                  >
                    {a.is_leader && <Crown size={9} style={{ color: '#f97316' }} />}
                    <span>{a.service_areas?.name ?? a.area_id}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleLeader(a)}
                      disabled={saving === a.area_id}
                      title={a.is_leader ? 'Remove leader' : 'Make leader'}
                      className="ml-0.5 rounded-full p-0.5 text-zinc-500 transition-colors hover:text-[#f97316]"
                    >
                      <Crown size={9} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(a.area_id)}
                      disabled={saving === a.area_id}
                      className="ml-0.5 rounded-full p-0.5 text-zinc-500 transition-colors hover:text-[#e55555]"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
                {unassignedAreas.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => e.target.value && handleAddArea(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px dashed #444',
                      borderRadius: 9999,
                      padding: '3px 10px',
                      fontSize: 11,
                      color: '#888',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="">+ Add area</option>
                    {unassignedAreas.map((a) => (
                      <option key={a.id} value={a.id} style={{ background: '#1a1a1a' }}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
                {assignments.length === 0 && serviceAreas.length === 0 && (
                  <span className="text-zinc-600">No service areas configured</span>
                )}
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-zinc-500">Midweek group leader</p>
            <select
              defaultValue=""
              onChange={(e) => e.target.value && adminAssignMidweekLeader(member.id, e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid #2e2e2e',
                borderRadius: 10,
                padding: '5px 10px',
                fontSize: 12,
                color: '#ccc',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="">Not a group leader</option>
              {midweekGroups.map((g) => (
                <option key={g.id} value={g.id} style={{ background: '#1a1a1a' }}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function AdminMembers() {
  const [members, setMembers] = useState([])
  const [serviceAreas, setServiceAreas] = useState([])
  const [midweekGroups, setMidweekGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([adminGetMembers(), adminGetServiceAreas(), adminGetMidweekGroups()]).then(
      ([{ data: membersData, error: e1 }, { data: areasData }, { data: groupsData }]) => {
        if (cancelled) return
        if (e1) {
          setError(true)
        } else {
          setMembers(membersData ?? [])
          setServiceAreas(areasData ?? [])
          setMidweekGroups(groupsData ?? [])
        }
        setLoading(false)
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return members
    return members.filter((m) => {
      const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.toLowerCase()
      return name.includes(query) || m.email?.toLowerCase().includes(query)
    })
  }, [members, search])

  const handleRoleChange = (memberId, newRole) => {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-medium text-primary">Members</h1>
        <button
          type="button"
          onClick={() => downloadCsv(toCsv(filtered), 'members.csv')}
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
                <th className="px-4 py-3 font-normal">Role</th>
                <th className="px-4 py-3 font-normal">Joined</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
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
                        <td className="px-4 py-3">
                          <RoleSelect memberId={member.id} currentRole={member.role} onRoleChange={handleRoleChange} />
                        </td>
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
                        <MemberDetails member={member} serviceAreas={serviceAreas} midweekGroups={midweekGroups} />
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
