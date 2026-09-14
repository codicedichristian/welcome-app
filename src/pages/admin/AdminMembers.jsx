import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, Download, ChevronDown, X, Star } from 'lucide-react'
import {
  adminGetMembers,
  adminUpdateUserRole,
  adminGetServiceAreas,
  adminAssignServiceArea,
  adminRemoveServiceArea,
  adminToggleAreaLeader,
  adminAssignMidweekLeader,
  adminRemoveMidweekLeader,
  adminAssignMidweekGroup,
  adminRemoveMidweekGroup,
  adminGetMidweekGroups,
  adminUpdateAdminTabs,
} from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'

const ROLE_OPTIONS = ['visitor', 'member', 'leader', 'admin']
const ROLE_STYLE = {
  visitor: { color: '#666666' },
  member:  { color: '#ffffff' },
  leader:  { color: '#5b8cff' },
  admin:   { color: '#f97316' },
}

const ALL_TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'members', label: 'Members' },
  { key: 'schedules', label: 'Schedules' },
  { key: 'sundays', label: 'Sundays' },
  { key: 'midweek', label: 'Midweek' },
  { key: 'news', label: 'News' },
  { key: 'events', label: 'Events' },
  { key: 'messages', label: 'Messages' },
  { key: 'join-requests', label: 'Join Team Req.' },
  { key: 'connect-requests', label: 'Bienvenido Req.' },
  { key: 'midweek-contacts', label: 'Midweek Clicks' },
  { key: 'nextsteps-requests', label: 'Next Steps Req.' },
  { key: 'event-contact-requests', label: 'Event Contact Req.' },
  { key: 'attendance', label: 'Attendance' },
]

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
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function AreaDropdown({ areas, onSelect }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!areas.length) return null

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left })
    setOpen((o) => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-surface hover:text-primary"
        aria-label="Add area"
      >
        +
      </button>
      {open && createPortal(
        <div
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            background: '#1a1a1a',
            border: '0.5px solid #2e2e2e',
            borderRadius: 10,
            minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}
        >
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(a)
                setOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                fontSize: 12,
                color: '#fff',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {a.name}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

function MemberRow({ member, serviceAreas, midweekGroups, takenGroupIds, onUpdate, setTabsTarget }) {
  const [expanded, setExpanded] = useState(false)
  const [roleSaving, setRoleSaving] = useState(false)

  const leadingAreaIds = useMemo(() => new Set(member.leadingAreas.map((a) => a.id)), [member.leadingAreas])
  const assignedAreaIds = useMemo(() => new Set(member.serviceAreas.map((a) => a.id)), [member.serviceAreas])
  const availableAreas = useMemo(
    () => serviceAreas.filter((a) => !assignedAreaIds.has(a.id)),
    [serviceAreas, assignedAreaIds],
  )
  const availableGroups = useMemo(
    () => midweekGroups.filter((g) => !takenGroupIds.has(g.id)),
    [midweekGroups, takenGroupIds],
  )

  const handleRoleChange = async (e) => {
    const newRole = e.target.value
    setRoleSaving(true)
    await adminUpdateUserRole(member.id, newRole)
    setRoleSaving(false)
    onUpdate(member.id, { role: newRole })
  }

  const handleAddArea = async (area) => {
    onUpdate(member.id, { serviceAreas: [...member.serviceAreas, area] })
    await adminAssignServiceArea(member.id, area.id)
  }

  const handleRemoveArea = async (areaId) => {
    onUpdate(member.id, {
      serviceAreas: member.serviceAreas.filter((a) => a.id !== areaId),
      leadingAreas: member.leadingAreas.filter((a) => a.id !== areaId),
    })
    await adminRemoveServiceArea(member.id, areaId)
    await adminToggleAreaLeader(member.id, areaId, false)
  }

  const handleToggleLeader = async (area) => {
    const isLeader = leadingAreaIds.has(area.id)
    if (isLeader) {
      onUpdate(member.id, { leadingAreas: member.leadingAreas.filter((a) => a.id !== area.id) })
    } else {
      onUpdate(member.id, { leadingAreas: [...member.leadingAreas, area] })
    }
    await adminToggleAreaLeader(member.id, area.id, !isLeader)
  }

  const handleAssignMidweek = async (e) => {
    const groupId = e.target.value
    if (!groupId) return
    const group = midweekGroups.find((g) => g.id === groupId)
    onUpdate(member.id, { midweekGroup: group, isMidweekLeader: true })
    await adminAssignMidweekLeader(member.id, groupId)
  }

  const handleRemoveMidweek = async () => {
    const groupId = member.midweekGroup?.id
    onUpdate(member.id, { midweekGroup: null, isMidweekLeader: false })
    if (groupId) await adminRemoveMidweekLeader(groupId)
  }

  const handleAssignMidweekGroup = async (e) => {
    const groupId = e.target.value
    if (!groupId) return
    const group = midweekGroups.find((g) => g.id === groupId)
    onUpdate(member.id, { memberGroup: group })
    await adminAssignMidweekGroup(member.id, groupId)
  }

  const handleRemoveMidweekGroup = async () => {
    onUpdate(member.id, { memberGroup: null })
    await adminRemoveMidweekGroup(member.id)
  }

  const roleColor = ROLE_STYLE[member.role]?.color ?? '#fff'

  return (
    <>
      <tr className="border-b border-border last:border-b-0">
        {/* Name */}
        <td className="px-4 py-3 text-sm text-primary">
          {member.first_name} {member.last_name}
        </td>

        {/* Email */}
        <td className="px-4 py-3 text-sm text-zinc-400">{member.email}</td>

        {/* Role */}
        <td className="px-4 py-3">
          <select
            aria-label="Member role"
            value={member.role ?? 'member'}
            onChange={handleRoleChange}
            disabled={roleSaving}
            style={{ color: roleColor, fontSize: 12, background: 'transparent', outline: 'none', cursor: 'pointer', opacity: roleSaving ? 0.5 : 1 }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r} style={{ background: '#1a1a1a', color: '#fff' }}>
                {r}
              </option>
            ))}
          </select>
        </td>

        {/* Service Areas */}
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-1">
            {member.serviceAreas.map((area) => (
              <span
                key={area.id}
                className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc' }}
              >
                {leadingAreaIds.has(area.id) && <Star size={8} style={{ color: '#f97316', fill: '#f97316' }} />}
                {area.name}
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleRemoveArea(area.id) }}
                  className="ml-0.5 text-zinc-600 hover:text-[#e55555]"
                  aria-label={`Remove ${area.name}`}
                >
                  <X size={9} />
                </button>
              </span>
            ))}
            <AreaDropdown areas={availableAreas} onSelect={handleAddArea} />
          </div>
        </td>

        {/* Leading */}
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            {member.serviceAreas.map((area) => {
              const isLeader = leadingAreaIds.has(area.id)
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleToggleLeader(area)}
                  className="flex items-center gap-1 text-left text-xs"
                >
                  <span
                    className="rounded px-1.5 py-0.5 font-medium transition-colors"
                    style={{
                      background: isLeader ? 'rgba(91,140,255,0.15)' : 'rgba(255,255,255,0.05)',
                      color: isLeader ? '#5b8cff' : '#555',
                    }}
                  >
                    {area.name}
                  </span>
                </button>
              )
            })}
          </div>
        </td>

        {/* Midweek Leader */}
        <td className="px-4 py-3">
          {member.isMidweekLeader ? (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <span>{member.midweekGroup?.zone ?? member.midweekGroup?.host ?? '—'}</span>
              <button
                type="button"
                onClick={handleRemoveMidweek}
                className="text-zinc-500 hover:text-[#e55555]"
                aria-label="Remove midweek leader"
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <select
              value=""
              onChange={handleAssignMidweek}
              style={{ fontSize: 11, background: 'transparent', color: '#555', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Assign group…</option>
              {availableGroups.map((g) => (
                <option key={g.id} value={g.id} style={{ background: '#1a1a1a', color: '#fff' }}>
                  {g.zone ?? g.host}
                </option>
              ))}
            </select>
          )}
        </td>

        {/* Midweek Group (member assignment) */}
        <td className="px-4 py-3">
          {member.memberGroup ? (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <span>{member.memberGroup.zone ?? member.memberGroup.host ?? '—'}</span>
              <button
                type="button"
                onClick={handleRemoveMidweekGroup}
                className="text-zinc-500 hover:text-[#e55555]"
                aria-label="Remove midweek group"
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <select
              value=""
              onChange={handleAssignMidweekGroup}
              style={{ fontSize: 11, background: 'transparent', color: '#555', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Assign group…</option>
              {midweekGroups.map((g) => (
                <option key={g.id} value={g.id} style={{ background: '#1a1a1a', color: '#fff' }}>
                  {g.zone ?? g.host}
                </option>
              ))}
            </select>
          )}
        </td>

        {/* Joined */}
        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
          {member.created_at ? formatShortDate(member.created_at.slice(0, 10)) : '—'}
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label="Toggle details"
            className="text-zinc-500 transition-colors hover:text-primary"
          >
            <ChevronDown size={15} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border bg-bg last:border-b-0">
          <td colSpan={9} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <p className="text-zinc-500">Phone</p>
                <p className="mt-0.5 text-primary">{member.phone || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500">Age range</p>
                <p className="mt-0.5 text-primary">{member.age_range || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500">Interests</p>
                <p className="mt-0.5 text-primary">{(member.interests ?? []).join(', ') || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500">Joined</p>
                <p className="mt-0.5 text-primary">{formatShortDate(member.created_at?.slice(0, 10))}</p>
              </div>
            </div>

            {(member.role === 'admin' || member.role === 'leader') && (
              <button
                onClick={() => setTabsTarget(member)}
                style={{
                  marginTop: 12,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #7c3aed',
                  background: 'transparent',
                  color: '#a78bfa',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Manage admin tabs
              </button>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function TabsSheet({ member, onClose, onSaved }) {
  // null admin_tabs means superadmin (all tabs). We represent that as all keys selected.
  const allKeys = ALL_TABS.map((t) => t.key)
  const [selected, setSelected] = useState(
    member.admin_tabs === null ? allKeys : member.admin_tabs,
  )
  const [saving, setSaving] = useState(false)

  function toggle(key) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      // If all tabs selected, save null (superadmin = all)
      const value =
        selected.length === allKeys.length ? null : selected.length === 0 ? [] : selected
      await adminUpdateAdminTabs(member.id, value)
      onSaved(member.id, value)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a1a1a',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 40px',
          zIndex: 201,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: '#fff' }}>
            Admin tabs — {member.first_name} {member.last_name}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
          {member.admin_tabs === null
            ? 'Superadmin: currently sees all tabs.'
            : `Restricted to ${member.admin_tabs.length} tab(s).`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {ALL_TABS.map(({ key, label }) => (
            <label
              key={key}
              style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ddd', fontSize: 15, cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={selected.includes(key)}
                onChange={() => toggle(key)}
                style={{ width: 18, height: 18, accentColor: '#7c3aed', cursor: 'pointer' }}
              />
              {label}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setSelected(allKeys)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #555',
              background: 'transparent', color: '#aaa', fontSize: 14, cursor: 'pointer',
            }}
          >
            Reset (all tabs)
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2, padding: '10px 0', borderRadius: 10, border: 'none',
              background: '#7c3aed', color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}

export default function AdminMembers() {
  const [members, setMembers] = useState([])
  const [serviceAreas, setServiceAreas] = useState([])
  const [midweekGroups, setMidweekGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [tabsTarget, setTabsTarget] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([adminGetMembers(), adminGetServiceAreas(), adminGetMidweekGroups()]).then(
      ([{ data: m, error: e }, { data: areas }, { data: groups }]) => {
        if (cancelled) return
        if (e) { setError(true) } else {
          setMembers(m ?? [])
          setServiceAreas(areas ?? [])
          setMidweekGroups(groups ?? [])
        }
        setLoading(false)
      },
    )
    return () => { cancelled = true }
  }, [])

  const onUpdate = useCallback((userId, patch) => {
    setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, ...patch } : m)))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) => {
      const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.toLowerCase()
      return name.includes(q) || m.email?.toLowerCase().includes(q)
    })
  }, [members, search])

  const takenGroupIds = useMemo(
    () => new Set(members.filter((m) => m.isMidweekLeader).map((m) => m.midweekGroup?.id).filter(Boolean)),
    [members],
  )

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
          <table className="w-full min-w-[1060px] text-left">
            <thead>
              <tr className="border-b border-border text-xs text-zinc-500">
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Role</th>
                <th className="px-4 py-3 font-normal">Service areas</th>
                <th className="px-4 py-3 font-normal">Leading</th>
                <th className="px-4 py-3 font-normal">Midweek leader</th>
                <th className="px-4 py-3 font-normal">Midweek group</th>
                <th className="px-4 py-3 font-normal">Joined</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-zinc-500">
                    No members found
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    serviceAreas={serviceAreas}
                    midweekGroups={midweekGroups}
                    takenGroupIds={takenGroupIds}
                    onUpdate={onUpdate}
                    setTabsTarget={setTabsTarget}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tabsTarget && (
        <TabsSheet
          member={tabsTarget}
          onClose={() => setTabsTarget(null)}
          onSaved={(id, value) =>
            setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, admin_tabs: value } : m)))
          }
        />
      )}
    </div>
  )
}
