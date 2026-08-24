import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { IconPray } from '@tabler/icons-react'

export default function PrayerRequestsPage() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        background: '#0a0a0a',
        minHeight: '100dvh',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        paddingBottom: '40px',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}
    >
      <button
        type="button"
        onClick={() => navigate('/', { replace: true })}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <ArrowLeft size={18} color="#8e8e93" />
        <span style={{ fontSize: '15px', fontWeight: '600', color: '#8e8e93' }}>Home</span>
      </button>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100dvh - 120px)',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        <IconPray size={48} color="#f97316" />
        <p style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
          Prayer Requests
        </p>
        <p style={{ fontSize: '15px', color: '#6e6e73', lineHeight: 1.5, maxWidth: '280px', margin: 0 }}>
          Coming soon — this feature is being prepared with love
        </p>
      </div>
    </div>
  )
}
