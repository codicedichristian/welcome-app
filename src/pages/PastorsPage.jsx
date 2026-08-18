import BackRow from '../components/BackRow.jsx'

export default function PastorsPage() {
  return (
    <div
      className="page-transition"
      style={{ background: '#0a0b0a', minHeight: '100dvh', paddingBottom: '40px' }}
    >
      {/* Back row over image */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + 12px)',
          left: '22px',
          zIndex: 10,
        }}
      >
        <BackRow label="Home" />
      </div>

      {/* Hero image */}
      <div style={{ position: 'relative', width: '100%', height: '260px' }}>
        <img
          src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(10,11,10,0.85) 100%)',
          }}
        />
        <div style={{ position: 'absolute', left: '22px', bottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#9a9a97', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Meet the Pastors
          </p>
          <p style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em' }}>
            Esteban & Antonella
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 22px 0' }}>
        <p style={{ fontSize: '15px', color: '#ffffff', lineHeight: 1.7 }}>
          Esteban and Antonella have been leading Welcome Church together since 2015. Esteban brings a
          passion for expository preaching and church planting across Europe, holding a Masters in
          Theology from Wheaton College. Antonella leads discipleship and pastoral care with a background
          in counseling and theology, walking alongside people through life's most challenging seasons
          with grace and wisdom.
        </p>
      </div>
    </div>
  )
}
