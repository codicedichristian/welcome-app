import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const FONT = '"Helvetica Neue", Helvetica, "SF Pro Text", system-ui, sans-serif'

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: FONT, background: '#0a0a0a', minHeight: '100dvh', color: '#ffffff' }}>
      <div style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)',
        maxWidth: '680px',
        margin: '0 auto',
      }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#5b8cff', fontSize: '15px', cursor: 'pointer', padding: 0, marginBottom: '24px' }}
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '13px', color: '#6e6e73', marginTop: '6px' }}>v1.1 · September 2026</p>

        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '15px', lineHeight: 1.7, color: '#c9c9c6' }}>

          <p>
            The Welcome app is a private project managed by an individual on behalf of Vive Church Madrid. We take your privacy seriously and want to be transparent about how we handle your data.
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', margin: 0 }}>1. What We Collect</h2>
            <p>Depending on how you use the app, we may collect:</p>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Name, email address, and phone number (registration and contact forms)</li>
              <li>Age range and interests (registration)</li>
              <li>Event attendance (RSVPs)</li>
              <li>Service team preferences (join requests)</li>
              <li>Midweek group interest</li>
              <li>Next Steps and Bienvenido form submissions</li>
            </ul>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', margin: 0 }}>2. How We Use Your Data</h2>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>To manage your account and app experience</li>
              <li>To follow up on requests you submit (events, teams, next steps)</li>
              <li>To send church communications relevant to you</li>
            </ul>
            <p>We do not sell, share, or use your data for advertising purposes.</p>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', margin: 0 }}>3. Data Storage</h2>
            <p>
              Your data is stored securely via Supabase, a GDPR-compliant infrastructure provider. Data is encrypted at rest and in transit. Only authorised administrators of this app can access your information.
            </p>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', margin: 0 }}>4. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data at any time. To make a request, send an email to{' '}
              <a href="mailto:christianscorza@outlook.com" style={{ color: '#5b8cff' }}>christianscorza@outlook.com</a>{' '}
              and we will process it within 30 days.
            </p>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', margin: 0 }}>5. Contact</h2>
            <p>
              For any questions about this policy or your data, contact us at{' '}
              <a href="mailto:madproduction@vivechurch.org" style={{ color: '#5b8cff' }}>madproduction@vivechurch.org</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
