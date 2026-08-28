import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#111111',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '24px',
        background: '#f97316', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '32px', fontSize: '36px',
      }}>
        ✝
      </div>

      <h1 style={{
        fontSize: '28px', fontWeight: '800', color: '#ffffff',
        margin: '0 0 16px 0', letterSpacing: '-0.02em',
      }}>
        welcome-app-church
      </h1>

      <p style={{
        fontSize: '16px', color: '#8e8e93', lineHeight: 1.6,
        maxWidth: '320px', margin: '0 0 48px 0',
      }}>
        Welcome App Church è un&apos;applicazione per la gestione e l&apos;accoglienza della comunità.
      </p>

      <button
        type="button"
        onClick={() => navigate('/welcome')}
        style={{
          padding: '16px 48px', background: '#f97316', border: 'none',
          borderRadius: '16px', fontSize: '17px', fontWeight: '700',
          color: '#ffffff', cursor: 'pointer', letterSpacing: '-0.01em',
        }}
      >
        Accedi
      </button>

      <p style={{ marginTop: '24px', fontSize: '13px', color: '#3a3a3a' }}>
        Accesso riservato ai membri della comunità
      </p>
    </div>
  )
}
