import { useNavigate } from 'react-router-dom'
import { PlayCircle, Image } from 'lucide-react'
import BackRow from '../components/BackRow.jsx'

function getLastSundayDate() {
  const today = new Date()
  const day = today.getDay() // 0 = Sunday
  const d = new Date(today)
  d.setDate(today.getDate() - day)
  return d
}

const lastSunday = getLastSundayDate()
const dateLabel = lastSunday.toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

const YOUTUBE_URL = 'https://youtube.com'
const PHOTOS_URL  = 'https://photos.google.com'

export default function LastSundayPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-bg px-4 pb-10" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
      <BackRow label="Home" />

      {/* Hero */}
      <div className="mt-5">
        <p style={{ fontSize: '13px', color: '#555' }}>{dateLabel}</p>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', marginTop: '4px' }}>
          Sunday Service
        </h1>
      </div>

      {/* Description card */}
      <div
        className="mt-5 rounded-[14px] border border-border p-4"
        style={{ background: '#1a1a1a' }}
      >
        <div className="flex flex-col gap-3">
          <div>
            <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
              Pastor
            </p>
            <p style={{ fontSize: '15px', color: '#ffffff', fontWeight: '500' }}>Pastor James</p>
          </div>
          <div style={{ height: '0.5px', background: '#1e1e1e' }} />
          <div>
            <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
              Sermon
            </p>
            <p style={{ fontSize: '15px', color: '#ffffff', fontWeight: '500' }}>Walking in Freedom</p>
          </div>
          <div style={{ height: '0.5px', background: '#1e1e1e' }} />
          <div>
            <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
              Scripture
            </p>
            <p style={{ fontSize: '15px', color: '#ffffff', fontWeight: '500' }}>Galatians 5:1</p>
          </div>
        </div>
      </div>

      {/* Video section */}
      <div className="mt-6">
        <p style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '10px' }}>Watch</p>
        <button
          type="button"
          onClick={() => window.open(YOUTUBE_URL, '_blank', 'noopener')}
          className="flex w-full items-center gap-3 rounded-[14px] border border-border p-4 text-left"
          style={{ background: '#1a1a1a' }}
        >
          <PlayCircle size={24} color="#ff0000" />
          <div className="flex-1">
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Watch on YouTube</p>
            <p
              style={{
                fontSize: '11px',
                color: '#555',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {YOUTUBE_URL}
            </p>
          </div>
        </button>
      </div>

      {/* Photos section */}
      <div className="mt-6">
        <p style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '10px' }}>Photos</p>
        <button
          type="button"
          onClick={() => window.open(PHOTOS_URL, '_blank', 'noopener')}
          className="flex w-full items-center gap-3 rounded-[14px] border border-border p-4 text-left"
          style={{ background: '#1a1a1a' }}
        >
          <Image size={24} color="#5b8cff" />
          <div className="flex-1">
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>View photos</p>
            <p
              style={{
                fontSize: '11px',
                color: '#555',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {PHOTOS_URL}
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
