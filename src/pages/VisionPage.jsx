import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin } from 'lucide-react'
import DetailPage from '../components/DetailPage.jsx'
import BackRow from '../components/BackRow.jsx'
import SkeletonCard, { SkeletonText } from '../components/SkeletonCard.jsx'
import { getExploreCard } from '../lib/api.js'

const FALLBACK_IMAGE = 'https://framerusercontent.com/images/RLmGvYtKErutAy2pF3l7ZVZMoc.jpg?width=2048&height=1365'
const FALLBACK_DESCRIPTION = 'We exist to see every person in Madrid and beyond experience the transforming love of Jesus Christ. We believe the local church is the hope of the world — a community of broken people made whole, sent out to serve their city and plant churches across the nations.'

const TILE_URL = 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'

const LOCATIONS = [
  { city: 'Madrid',      country: 'Spain',          lat: 40.4168,  lng: -3.7038,   year: 2015 },
  { city: 'London',      country: 'United Kingdom',  lat: 51.5074,  lng: -0.1278,   year: 2017 },
  { city: 'Berlin',      country: 'Germany',         lat: 52.5200,  lng: 13.4050,   year: 2018 },
  { city: 'Paris',       country: 'France',          lat: 48.8566,  lng: 2.3522,    year: 2019 },
  { city: 'Rome',        country: 'Italy',           lat: 41.9028,  lng: 12.4964,   year: 2020 },
  { city: 'New York',    country: 'United States',   lat: 40.7128,  lng: -74.0060,  year: 2016 },
  { city: 'Los Angeles', country: 'United States',   lat: 34.0522,  lng: -118.2437, year: 2018 },
  { city: 'São Paulo',   country: 'Brazil',          lat: -23.5505, lng: -46.6333,  year: 2019 },
  { city: 'Tokyo',       country: 'Japan',           lat: 35.6762,  lng: 139.6503,  year: 2021 },
  { city: 'Singapore',   country: 'Singapore',       lat: 1.3521,   lng: 103.8198,  year: 2022 },
]

const WHITE_PIN = L.divIcon({
  html: '<div style="width:10px;height:10px;border-radius:50%;background:#ffffff;box-shadow:0 0 0 2px rgba(255,255,255,0.3),0 2px 6px rgba(0,0,0,0.6)"></div>',
  className: '',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
  popupAnchor: [0, -8],
})

function VisionSkeleton() {
  return (
    <div style={{ background: '#0a0b0a', minHeight: '100dvh', paddingBottom: '40px' }}>
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', left: '22px', zIndex: 10 }}>
        <BackRow label="Home" fallback="/" />
      </div>
      <SkeletonCard height={260} radius={0} />
      <div style={{ padding: '20px 22px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SkeletonText width="55%" height={26} />
        <SkeletonText height={15} />
        <SkeletonText width="85%" height={15} />
        <SkeletonText width="70%" height={15} />
        <div style={{ marginTop: '8px' }}>
          <SkeletonCard height={220} radius={16} />
        </div>
      </div>
    </div>
  )
}

export default function VisionPage() {
  const [heroImage, setHeroImage] = useState(null)
  const [description, setDescription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getExploreCard('/vision').then(({ data }) => {
      setHeroImage(data?.image_url || FALLBACK_IMAGE)
      setDescription(data?.description || FALLBACK_DESCRIPTION)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return <VisionSkeleton />

  return (
    <DetailPage
      image={heroImage}
      title="Our Vision"
      description={description}
      backLabel="Home"
      backPath="/"
    >
      <p style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginTop: '8px', marginBottom: '16px' }}>
        Our Churches
      </p>

      <div style={{ height: '220px', borderRadius: '16px', overflow: 'hidden' }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
        >
          <TileLayer url={TILE_URL} />
          {LOCATIONS.map((loc) => (
            <Marker key={loc.city} position={[loc.lat, loc.lng]} icon={WHITE_PIN}>
              <Popup closeButton={false} className="vision-popup">
                <span style={{ fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {loc.city}, {loc.country} · Est. {loc.year}
                </span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ marginTop: '16px' }}>
        {LOCATIONS.map((loc, i) => (
          <div
            key={loc.city}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 0',
              borderBottom: i < LOCATIONS.length - 1 ? '0.5px solid #1e1e1e' : 'none',
            }}
          >
            <MapPin size={16} color="#5b8cff" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '13px', color: '#ffffff' }}>
              {loc.city}, {loc.country}
            </span>
            <span style={{ fontSize: '13px', color: '#6b6b68' }}>Est. {loc.year}</span>
          </div>
        ))}
      </div>
    </DetailPage>
  )
}
