import BackRow from '../components/BackRow.jsx'

const PASTORS = [
  {
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    role: 'SENIOR PASTOR',
    name: 'John Mitchell',
    description:
      'John has been leading the church since 2015 with a passion for community and expository preaching. He holds a Masters in Theology from Wheaton College and has a heart for church planting across Europe.',
  },
  {
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    role: 'ASSOCIATE PASTOR',
    name: 'Sarah Mitchell',
    description:
      "Sarah leads our discipleship and pastoral care ministry. With a background in counseling and theology, she has a gift for helping people navigate life's most challenging seasons with grace and wisdom.",
  },
]

export default function PastorsPage() {
  return (
    <div
      className="page-transition"
      style={{ background: '#0a0b0a', minHeight: '100dvh', paddingBottom: '40px' }}
    >
      {/* Back row */}
      <div
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
          paddingLeft: '22px',
          paddingRight: '22px',
          marginBottom: '24px',
        }}
      >
        <BackRow label="Home" />
      </div>

      {/* Stacked pastors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {PASTORS.map((pastor) => (
          <div key={pastor.name}>
            {/* Hero image */}
            <div style={{ position: 'relative', width: '100%', height: '260px' }}>
              <img
                src={pastor.image}
                alt={pastor.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, transparent 30%, #0a0b0a 100%)',
                }}
              />
              {/* Overlaid name/role */}
              <div style={{ position: 'absolute', left: '20px', bottom: '20px' }}>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#9a9a97',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {pastor.role}
                </p>
                <p
                  style={{
                    fontSize: '26px',
                    fontWeight: '800',
                    color: '#ffffff',
                    marginTop: '4px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {pastor.name}
                </p>
              </div>
            </div>

            {/* Description */}
            <div style={{ padding: '20px 20px 0' }}>
              <p style={{ fontSize: '15px', color: '#c9c9c6', lineHeight: 1.7 }}>
                {pastor.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
