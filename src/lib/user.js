export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('welcome_user')) ?? {}
  } catch {
    return {}
  }
}
