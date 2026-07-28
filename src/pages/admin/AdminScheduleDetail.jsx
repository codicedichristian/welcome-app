import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { adminGetServiceAreas, adminGetScheduleDates, getScheduleRoster } from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'

const STATUS_STYLE = {
  accepted: { color: '#4caf7d', label: 'Accepted' },
  declined:  { color: '#e55555', label: 'Declined' },
  pending:   { color: '#666666', label: 'Pending' },
}

function RosterTab({ scheduleId, areaId }) {
  const [roster, setRoster] = useState(null)

  useEffect(() => {
    if (!areaId) return
    setRoster(null)
    getScheduleRoster(scheduleId, areaId).then(({ data }) => setRoster(data ?? []))
  }, [scheduleId, areaId])

  if (roster === null) return <div className="mt-4"><Spinner /></div>

  const totals = {
    accepted: roster.filter((r) => r.status === 'accepted').length,
    declined:  roster.filter((r) => r.status === 'declined').length,
    pending:   roster.filter((r) => r.status === 'pending').length,
  }

  return (
    <div className="mt-4">
      <p className="mb-3 text-xs text-zinc-500">
        {totals.accepted} accepted · {totals.declined} declined · {totals.pending} pending
      </p>
      {roster.length === 0 ? (
        <p className="text-sm text-zinc-500">No one assigned to this area for this service.</p>
      ) : (
        <div className="space-y-2">
          {roster.map((entry) => {
            const st = STATUS_STYLE[entry.status] ?? STATUS_STYLE.pending
            return (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span className="text-sm text-primary">
                  {entry.users?.first_name} {entry.users?.last_name}
                </span>
                <span className="text-xs font-medium" style={{ color: st.color }}>{st.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminScheduleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [scheduleDate, setScheduleDate] = useState(null)
  const [allAreas, setAllAreas] = useState([])
  const [activeMacro, setActiveMacro] = useState(0)
  const [activeSub, setActiveSub] = useState(0)

  useEffect(() => {
    Promise.all([adminGetServiceAreas(), adminGetScheduleDates()]).then(
      ([{ data: areas }, { data: dates }]) => {
        setAllAreas(areas ?? [])
        const match = (dates ?? []).find((d) => d.id === id)
        setScheduleDate(match?.date ?? null)
        setLoading(false)
      },
    )
  }, [id])

  const macroAreas = useMemo(() => allAreas.filter((a) => a.is_macro), [allAreas])
  const subAreas = useMemo(() => {
    const macro = macroAreas[activeMacro]
    if (!macro) return []
    return allAreas.filter((a) => a.parent_id === macro.id)
  }, [allAreas, macroAreas, activeMacro])

  const rosterAreaId = useMemo(() => {
    if (subAreas.length > 0) return subAreas[activeSub]?.id
    return macroAreas[activeMacro]?.id
  }, [macroAreas, subAreas, activeMacro, activeSub])

  if (loading) return <Spinner />

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/admin/schedules')}
        className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
        Schedules
      </button>

      <h1 className="text-lg font-medium text-primary">
        {scheduleDate ? `Service Roster — ${formatShortDate(scheduleDate)}` : 'Service Roster'}
      </h1>

      {macroAreas.length > 0 ? (
        <section className="mt-6">
          <div className="flex gap-4 border-b border-border">
            {macroAreas.map((area, i) => (
              <button
                key={area.id}
                type="button"
                onClick={() => { setActiveMacro(i); setActiveSub(0) }}
                className={`pb-2 text-sm transition-colors ${
                  activeMacro === i
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-zinc-500 hover:text-primary'
                }`}
              >
                {area.name}
              </button>
            ))}
          </div>

          {subAreas.length > 0 && (
            <div className="mt-2 flex gap-3 border-b border-border/50">
              {subAreas.map((area, i) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setActiveSub(i)}
                  className={`pb-1.5 text-xs transition-colors ${
                    activeSub === i ? 'border-b border-primary text-primary' : 'text-zinc-600 hover:text-primary'
                  }`}
                >
                  {area.name}
                </button>
              ))}
            </div>
          )}

          <RosterTab scheduleId={id} areaId={rosterAreaId} />
        </section>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">No service areas configured.</p>
      )}
    </div>
  )
}
