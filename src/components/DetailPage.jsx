import BackRow from './BackRow.jsx'

export default function DetailPage({
  image,
  title,
  subtitle,
  description,
  backLabel,
  backPath,
  children,
}) {
  return (
    <div
      className="page-transition"
      style={{ background: '#0a0b0a', minHeight: '100dvh', paddingBottom: '40px' }}
    >
      {/* Back row — absolute over hero */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + 12px)',
          left: '22px',
          zIndex: 10,
        }}
      >
        <BackRow label={backLabel} fallback={backPath} />
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', width: '100%', height: '260px', background: '#1a1a1a' }}>
        {image && (
          <img
            src={image}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 30%, #0a0b0a 100%)',
          }}
        />
        <div style={{ position: 'absolute', left: '22px', bottom: '20px' }}>
          <p style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
            {title}
          </p>
          {subtitle && (
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#9a9a97', marginTop: '4px', marginBottom: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 22px 0' }}>
        {description && (
          <p style={{ fontSize: '15px', color: '#c9c9c6', lineHeight: 1.7, margin: 0 }}>
            {description}
          </p>
        )}
        {children && (
          <div style={{ marginTop: description ? '24px' : '0' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
