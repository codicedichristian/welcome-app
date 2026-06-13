export const TOTAL_STEPS = 8

export const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  source: '',
  ageRange: '',
  interests: [],
  notifications: { email: false, whatsapp: false, app: false },
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export function isStepValid(step, data) {
  switch (step) {
    case 1:
      return data.firstName.trim() !== '' && data.lastName.trim() !== ''
    case 2:
      return EMAIL_REGEX.test(data.email)
    case 3:
      return data.phone.trim() !== ''
    case 4:
      return data.password.length >= MIN_PASSWORD_LENGTH && data.password === data.confirmPassword
    case 5:
      return data.source !== ''
    case 6:
      return data.ageRange !== ''
    case 7:
      return data.interests.length > 0
    case 8:
      return true
    default:
      return false
  }
}
