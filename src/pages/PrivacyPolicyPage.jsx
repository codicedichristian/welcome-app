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
        <p style={{ fontSize: '13px', color: '#6e6e73', marginTop: '6px' }}>v1.0 · August 2026</p>

        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px', lineHeight: 1.7, color: '#c9c9c6' }}>
          <p>
            Welcome Church (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use the Welcome Church app.
          </p>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>1. Data We Collect</h2>
            <p>
              We collect the information you provide during registration (name, email, phone number, age range, interests) and usage data to improve your experience.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>2. How We Use Your Data</h2>
            <p>
              Your data is used to provide and personalise the app experience, send you event reminders and church communications (with your consent), and improve our services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>3. Data Storage &amp; Security</h2>
            <p>
              Your data is stored securely using AES-256 encryption at rest and TLS 1.3 in transit. Passwords are hashed using bcrypt and are never stored in plain text.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>4. Your Rights (GDPR)</h2>
            <p>
              Under the General Data Protection Regulation (GDPR), you have the right to access, correct, or delete your personal data. You may also withdraw consent for marketing or profiling at any time from your profile settings.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>5. Contact</h2>
            <p>
              For any data-related requests or questions, please contact us at privacy@welcomechurch.com.
            </p>
          </section>

          <p style={{ fontSize: '13px', color: '#6e6e73', marginTop: '12px' }}>
            Full policy text will be published here. This is a placeholder version.
          </p>
        </div>
      </div>
    </div>
  )
}
