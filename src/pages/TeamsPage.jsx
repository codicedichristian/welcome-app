import { Music, Camera, Volume2, Smartphone, Settings } from 'lucide-react'
import BackRow from '../components/BackRow.jsx'

const TEAMS = [
  {
    icon: Music,
    color: '#a78bfa',
    name: 'Worship',
    description:
      'Our worship team leads the church in song every Sunday. If you play an instrument or love to sing, this might be your place.',
  },
  {
    icon: Camera,
    color: '#5b8cff',
    name: 'Media',
    description:
      'We capture and broadcast everything that happens at Welcome — photos, videos, live streams and social media.',
  },
  {
    icon: Volume2,
    color: '#5b8cff',
    name: 'Sound',
    description:
      'The sound team makes sure every word and note is heard clearly. We run the mixing desk, monitors and all audio equipment.',
  },
  {
    icon: Smartphone,
    color: '#4caf7d',
    name: 'Digital',
    description: 'From our website to our app, the digital team keeps Welcome connected online.',
  },
  {
    icon: Settings,
    color: '#f97316',
    name: 'Production',
    description:
      'Production oversees Media and Sound, making sure every Sunday runs smoothly from a technical standpoint.',
  },
]

export default function TeamsPage() {
  return (
    <div
      className="page-transition"
      style={{
        background: '#0a0b0a',
        minHeight: '100dvh',
        paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
        paddingLeft: '22px',
        paddingRight: '22px',
        paddingBottom: '40px',
      }}
    >
      <BackRow label="Home" />

      <h1
        style={{
          fontSize: '24px',
          fontWeight: '800',
          color: '#ffffff',
          letterSpacing: '-0.01em',
          marginTop: '20px',
          marginBottom: '24px',
        }}
      >
        Our Teams
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {TEAMS.map((team) => {
          const Icon = team.icon
          return (
            <div
              key={team.name}
              style={{
                background: '#1a1a1a',
                border: '0.5px solid #2e2e2e',
                borderRadius: '20px',
                padding: '18px',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: `${team.color}26`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} color={team.color} />
                </div>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginLeft: '12px', flex: 1 }}>
                  {team.name}
                </p>
                <span
                  style={{
                    background: `${team.color}26`,
                    color: team.color,
                    fontSize: '11px',
                    fontWeight: '700',
                    borderRadius: '20px',
                    padding: '4px 10px',
                  }}
                >
                  Join this team
                </span>
              </div>

              <p style={{ fontSize: '14px', color: '#c9c9c6', lineHeight: 1.6, marginTop: '12px' }}>
                {team.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
