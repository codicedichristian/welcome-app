import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Clock, Check, Home } from 'lucide-react'
import { getMidweekGroups, rsvpMidweek } from '../lib/api.js'
import { midweeks as fallbackMidweeks } from '../data/midweeks.js'
import { getEventById } from '../data/events.js'
import { normalizeEvent, getNextWednesday } from '../lib/events.js'
import { getStoredUser } from '../lib/user.js'
import { isRsvped, addRsvp, getMidweekGroupId, setMidweekGroupId } from '../lib/rsvp.js'
import BackRow from '../components/BackRow.jsx'
import Spinner from '../components/Spinner.jsx'
import ErrorState from '../components/ErrorState.jsx'

const MADRID_CENTER = [40.4168, -3.7038]
const TILE_URL = 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
const midweekEvent = normalizeEvent(getEventById('midweek'))

function createPinIcon(selected) {
  const html = renderToStaticMarkup(
    <div className={`midweek-pin ${selected ? 'midweek-pin-selected' : ''}`}>
      {selected && <span className="midweek-pin-pulse" />}
      <span className="midweek-pin-circle">
        <Home size={16} color="#ffffff" strokeWidth={2.5} />
      </span>
    </div>,
  )

  return L.divIcon({
    html,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function MidweekPage() {
  const location = useLocation()
  const popupRef = useRef(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedId, setSelectedId] = useState(() => location.state?.selectedGroupId ?? null)
  const [going, setGoing] = useState(
    () => isRsvped('midweek') && String(getMidweekGroupId()) === String(location.state?.selectedGroupId ?? null),
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error: apiError } = await getMidweekGroups()
      if (cancelled) return

      if (apiError || !data || data.length === 0) {
        setGroups(fallbackMidweeks)
        setError(Boolean(apiError) && fallbackMidweeks.length === 0)
      } else {
        setGroups(data)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedGroup = groups.find((group) => String(group.id) === String(selectedId))

  const selectGroup = (id) => {
    setSelectedId(id)
    setGoing(isRsvped('midweek') && String(getMidweekGroupId()) === String(id))
  }

  useEffect(() => {
    if (location.state?.selectedGroupId && popupRef.current) {
      popupRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups])

  const handleGoing = async () => {
    const message = encodeURIComponent(
      `Hi ${selectedGroup.host}, I'd like to come to the Midweek at your place this Wednesday!`,
    )
    window.open(`https://wa.me/${selectedGroup.phone}?text=${message}`, '_blank', 'noopener')

    const user = getStoredUser()
    if (user.id) {
      const { error: apiError } = await rsvpMidweek(user.id, selectedGroup.id, getNextWednesday())
      if (apiError) {
        addRsvp('midweek')
        setMidweekGroupId(selectedGroup.id)
      }
    } else {
      addRsvp('midweek')
      setMidweekGroupId(selectedGroup.id)
    }
    setGoing(true)
  }

  return (
    <div className="min-h-dvh bg-bg px-4 pt-6 pb-8">
      <BackRow label="Events" />

      <h1 className="mt-4 text-[15px] font-medium text-primary">Find your group</h1>
      <p className="mt-1 text-[10px] text-zinc-500">Wed · {midweekEvent.time}</p>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <>
          <div className="mt-4 h-[220px] overflow-hidden rounded-[14px]">
            <MapContainer center={MADRID_CENTER} zoom={12} className="h-full w-full">
              <TileLayer
                url={TILE_URL}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {groups.map((group) => (
                <Marker
                  key={group.id}
                  position={[Number(group.lat), Number(group.lng)]}
                  icon={createPinIcon(String(group.id) === String(selectedId))}
                  eventHandlers={{ click: () => selectGroup(group.id) }}
                />
              ))}
            </MapContainer>
          </div>

          {!selectedGroup && <p className="mt-3 text-[10px] text-zinc-500">Tap a pin to see the group details</p>}

          {selectedGroup && (
            <div ref={popupRef} className="mt-3 rounded-[14px] border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-xs font-medium text-primary">
                  {selectedGroup.initials}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-primary">{selectedGroup.host}</p>
                  <p className="text-[10px] text-zinc-500">{selectedGroup.zone}</p>
                </div>
                <div className="rounded-full bg-accent-blue px-2.5 py-1 text-[9px] font-medium text-bg">
                  {selectedGroup.confirmed ?? 0} confirmed
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <MapPin size={14} className="text-accent-blue" />
                  <span>{selectedGroup.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Clock size={14} className="text-accent-blue" />
                  <span>{midweekEvent.time}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex">
                  {(selectedGroup.confirmedPeople ?? []).map((initial, index) => (
                    <span
                      key={index}
                      className="-ml-2 flex h-5 w-5 items-center justify-center rounded-full border border-bg bg-surface text-[8px] text-primary first:ml-0"
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-zinc-500">{selectedGroup.confirmed ?? 0} people going</span>
              </div>

              <button
                type="button"
                onClick={handleGoing}
                disabled={going}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-medium transition-colors ${
                  going ? 'bg-accent-green text-bg' : 'border border-primary bg-bg text-primary'
                }`}
              >
                {going && <Check size={18} />}
                <span>{going ? "You're in!" : "I'm going"}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
