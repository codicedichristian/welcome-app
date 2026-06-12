const RSVP_KEY = 'welcome_rsvp'
const MIDWEEK_GROUP_KEY = 'welcome_midweek_group'

export function getRsvpIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(RSVP_KEY))
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

export function isRsvped(eventId) {
  return getRsvpIds().includes(eventId)
}

export function addRsvp(eventId) {
  const ids = getRsvpIds()
  if (!ids.includes(eventId)) {
    localStorage.setItem(RSVP_KEY, JSON.stringify([...ids, eventId]))
  }
}

export function getMidweekGroupId() {
  return localStorage.getItem(MIDWEEK_GROUP_KEY) || null
}

export function setMidweekGroupId(groupId) {
  localStorage.setItem(MIDWEEK_GROUP_KEY, String(groupId))
}
