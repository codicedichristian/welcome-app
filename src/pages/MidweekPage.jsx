import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Clock, Check, Home, ChevronRight } from 'lucide-react'
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

function InvalidateSizeOnMount() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100)
    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', handleResize)
    }
  }, [map])
  return null
}
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
  const navigate = useNavigate()
  const popupRef = useRef(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [mapReady, setMapReady] = useState(false)
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
    return () => { cancelled = true }
  }, [])

  const selectedGroup = groups.find((group) => String(group.id) === String(selectedId))

  const selectGroup = (id) => {
    setSelectedId(id)
    setGoing(isRsvped('midweek') && String(getMidweekGroupId()) === String(id))
  }

  useEffect(() => {
    if (groups.filter((g) => g.lat != null && g.lng != null).length > 0) {
      const t = setTimeout(() => setMapReady(true), 100)
      return () => clearTimeout(t)
    }
  }, [groups])

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
    <div
      className="page-transition"
      style={{
        background: '#0a0b0a',
        minHeight: '100dvh',
        paddingTop: 'calc(env(safe-area-inset-top) + 56px)',
        paddingBottom: '40px',
      }}
    >
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', left: '22px', zIndex: 10 }}>
        <BackRow label="Midweeks" fallback="/midweeks" />
      </div>

      <div style={{ padding: '0 22px' }}>
        <p style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em', marginBottom: '20px' }}>
          Find your group
        </p>

        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState />
        ) : (
          <>
            {mapReady && (
              <div style={{ borderRadius: '14px', overflow: 'hidden' }}>
                <MapContainer
                  key={groups.length}
                  center={MADRID_CENTER}
                  zoom={12}
                  style={{ height: '220px', width: '100%' }}
                >
                  <InvalidateSizeOnMount />
                  <TileLayer
                    url={TILE_URL}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {groups.filter((g) => g.lat != null && g.lng != null).map((group) => (
                    <Marker
                      key={group.id}
                      position={[Number(group.lat), Number(group.lng)]}
                      icon={createPinIcon(String(group.id) === String(selectedId))}
                      eventHandlers={{ click: () => selectGroup(group.id) }}
                    />
                  ))}
                </MapContainer>
              </div>
            )}

            {!selectedGroup && (
              <p className="mt-3 text-[13px] text-zinc-500">Tap a pin to see the group details</p>
            )}

            {selectedGroup && (
              <div
                ref={popupRef}
                className="mt-3 rounded-[14px] border border-border bg-surface p-4"
                onClick={() => navigate(`/midweek/${selectedGroup.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-[14px] font-medium text-primary">
                    {selectedGroup.initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] text-primary">{selectedGroup.host}</p>
                    <p className="text-[13px] text-zinc-500">{selectedGroup.zone}</p>
                  </div>
                  <ChevronRight size={16} color="#444444" />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2 text-[14px] text-zinc-400">
                    <MapPin size={15} className="text-accent-blue" />
                    <span>{selectedGroup.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[14px] text-zinc-400">
                    <Clock size={15} className="text-accent-blue" />
                    <span>{midweekEvent.time}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex">
                    {(selectedGroup.confirmedPeople ?? []).map((initial, index) => (
                      <span
                        key={index}
                        className="-ml-2 flex h-5 w-5 items-center justify-center rounded-full border border-bg bg-surface text-[9px] text-primary first:ml-0"
                      >
                        {initial}
                      </span>
                    ))}
                  </div>
                  <span className="text-[13px] text-zinc-500">{selectedGroup.confirmed ?? 0} people going</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleGoing() }}
                  disabled={going}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[16px] font-medium transition-colors ${
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
    </div>
  )
}
