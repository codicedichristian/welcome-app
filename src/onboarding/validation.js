export const TOTAL_STEPS = 7

export const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  source: '',
  ageRange: '',
  interests: [],
  notifications: { email: false, whatsapp: false, app: false },
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isStepValid(step, data) {
  switch (step) {
    case 1:
      return data.firstName.trim() !== '' && data.lastName.trim() !== ''
    case 2:
      return EMAIL_REGEX.test(data.email)
    case 3:
      return data.phone.trim() !== ''
    case 4:
      return data.source !== ''
    case 5:
      return data.ageRange !== ''
    case 6:
      return data.interests.length > 0
    case 7:
      return true
    default:
      return false
  }
}
