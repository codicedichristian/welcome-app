import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { TOTAL_STEPS, initialFormData, isStepValid } from '../onboarding/validation.js'
import { registerUser, saveSubscription } from '../lib/api.js'
import { toStoredUser } from '../lib/user.js'
import { subscribeToPush } from '../lib/push.js'
import NameStep from '../onboarding/steps/NameStep.jsx'
import EmailStep from '../onboarding/steps/EmailStep.jsx'
import PhoneStep from '../onboarding/steps/PhoneStep.jsx'
import PasswordStep from '../onboarding/steps/PasswordStep.jsx'
import SourceStep from '../onboarding/steps/SourceStep.jsx'
import AgeRangeStep from '../onboarding/steps/AgeRangeStep.jsx'
import InterestsStep from '../onboarding/steps/InterestsStep.jsx'
import NotificationsStep from '../onboarding/steps/NotificationsStep.jsx'

const STEPS = [NameStep, EmailStep, PhoneStep, PasswordStep, SourceStep, AgeRangeStep, InterestsStep, NotificationsStep]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState(initialFormData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const update = (patch) => setFormData((prev) => ({ ...prev, ...patch }))

  const isLastStep = step === TOTAL_STEPS
  const valid = isStepValid(step, formData)

  const handleBack = () => {
    if (step === 1) return
    setDirection(-1)
    setStep((s) => s - 1)
  }

  const handleContinue = async () => {
    if (!valid) return

    if (isLastStep) {
      setSaving(true)
      setError(null)

      console.log('Starting registration...')
      const { user, authId, error: registerError } = await registerUser(formData)

      if (registerError) {
        setError(registerError.message || 'Something went wrong, try again')
        setSaving(false)
        return
      }

      localStorage.setItem('welcome_user', JSON.stringify(toStoredUser(user, authId)))

      if (formData.notifications.app) {
        const subscription = await subscribeToPush()
        if (subscription) {
          const result = await saveSubscription(user.id, subscription)
          console.log('Save result:', result)
        }
      }

      navigate('/', { replace: true })
      return
    }

    setDirection(1)
    setStep((s) => s + 1)
  }

  const StepComponent = STEPS[step - 1]

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className={`text-inactive transition-opacity ${step === 1 ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        >
          <ChevronLeft size={22} />
        </button>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-[13px] text-zinc-500">
        Step {step} of {TOTAL_STEPS}
      </p>

      <div className="relative mt-6 flex-1 overflow-x-hidden overflow-y-auto">
        <div key={step} className={direction === 1 ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
          <StepComponent formData={formData} update={update} />
        </div>
      </div>

      {error && <p className="mt-3 text-center text-xs text-[#e55555]">{error}</p>}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!valid || saving}
        className={`mt-4 w-full shrink-0 rounded-xl py-3.5 text-base font-medium transition-colors ${
          isLastStep
            ? 'bg-accent-green text-bg'
            : valid
              ? 'bg-primary text-bg'
              : 'cursor-not-allowed bg-surface text-zinc-600'
        } ${saving ? 'opacity-70' : ''}`}
      >
        {isLastStep ? (saving ? 'Saving...' : "Let's go") : 'Continue'}
      </button>

      {step === 1 && (
        <button type="button" onClick={() => navigate('/login')} className="mt-4 text-center text-xs text-zinc-500">
          Already have an account? Sign in
        </button>
      )}
    </div>
  )
}
