import { Check } from 'lucide-react'

function ConsentCheckbox({ checked, onChange, required, children }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-checked={checked}
        role="checkbox"
        style={{
          flexShrink: 0,
          marginTop: '1px',
          width: '20px',
          height: '20px',
          borderRadius: '6px',
          border: checked ? '1.5px solid #f97316' : '1.5px solid #2e2e2e',
          background: checked ? '#f97316' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 150ms, border-color 150ms',
        }}
      >
        {checked && <Check size={13} strokeWidth={3} color="#ffffff" />}
      </button>
      <span style={{ fontSize: '14px', color: '#ffffff', lineHeight: 1.5, flex: 1 }}>
        {children}
      </span>
    </div>
  )
}

const DIVIDER = <div style={{ height: '0.5px', background: '#2e2e2e' }} />

export default function ConsentStep({ formData, update }) {
  const { privacyAccepted, marketingConsent, profilingConsent } = formData

  return (
    <div>
      <h2 className="text-[28px] font-bold text-primary leading-tight">Your privacy matters</h2>
      <p className="mt-2 text-[15px] text-zinc-500">Please review and confirm before joining.</p>

      <div
        style={{
          marginTop: '28px',
          background: '#1a1a1a',
          border: '0.5px solid #2e2e2e',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <ConsentCheckbox
          checked={privacyAccepted}
          onChange={(val) => update({ privacyAccepted: val })}
          required
        >
          I have read and accept the{' '}
          <button
            type="button"
            onClick={() => window.open('/privacy-policy', '_blank')}
            style={{ color: '#5b8cff', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, fontSize: '14px', cursor: 'pointer', lineHeight: 1.5 }}
          >
            Privacy Policy and Terms of Service
          </button>
          .
        </ConsentCheckbox>

        {!privacyAccepted && (
          <p style={{ fontSize: '12px', color: '#e55555', marginTop: '-8px' }}>
            You must accept to continue.
          </p>
        )}

        {DIVIDER}

        <ConsentCheckbox
          checked={marketingConsent}
          onChange={(val) => update({ marketingConsent: val })}
        >
          I agree to receive communications about events, news and initiatives via Email and WhatsApp.
        </ConsentCheckbox>

        {DIVIDER}

        <ConsentCheckbox
          checked={profilingConsent}
          onChange={(val) => update({ profilingConsent: val })}
        >
          I agree to the analysis of my interests and age to receive personalised content.
        </ConsentCheckbox>
      </div>
    </div>
  )
}
