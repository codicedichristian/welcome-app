import BackRow from '../components/BackRow.jsx'

const PASTORS = [
  {
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    title: 'Senior Pastor',
    name: 'John Mitchell',
    description:
      'John has been leading the church since 2015 with a passion for community and expository preaching. He holds a Masters in Theology from Wheaton College and has a heart for church planting across Europe.',
  },
  {
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    title: 'Associate Pastor',
    name: 'Sarah Mitchell',
    description:
      'Sarah leads our discipleship and pastoral care ministry. With a background in counseling and theology, she has a gift for helping people navigate life\'s most challenging seasons with grace and wisdom.',
  },
]

export default function PastorsPage() {
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
        Meet the Pastors
      </h1>

      {PASTORS.map((pastor) => (
        <div
          key={pastor.name}
          style={{
            background: '#1a1a1a',
            border: '0.5px solid #2e2e2e',
            borderRadius: '20px',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          {/* Hero image */}
          <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <img
              src={pastor.image}
              alt={pastor.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent 40%, #0a0b0a 100%)',
              }}
            />
          </div>

          {/* Text */}
          <div style={{ padding: '16px' }}>
            <p
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#9a9a97',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '4px',
              }}
            >
              {pastor.title}
            </p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
              {pastor.name}
            </p>
            <p style={{ fontSize: '14px', color: '#c9c9c6', lineHeight: 1.6 }}>
              {pastor.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
