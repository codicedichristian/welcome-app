export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('welcome_user')) ?? {}
  } catch {
    return {}
  }
}

// Maps a public.users row (snake_case) to the shape stored in localStorage.
export function toStoredUser(profile, authId) {
  return {
    id: profile.id,
    authId,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    ageRange: profile.age_range,
    interests: profile.interests,
    notifications: profile.notifications,
    registeredAt: profile.created_at,
  }
}
