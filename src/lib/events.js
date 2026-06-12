import { formatTime12h, formatLongDate, capitalize } from './format.js'

const RECURRING_WEEKDAY = {
  weekly_sunday: 0,
  weekly_monday: 1,
  weekly_wednesday: 3,
  biweekly_sunday: 0,
}

const RECURRING_LABELS = {
  weekly_sunday: 'Every Sunday',
  weekly_monday: 'Every Monday',
  weekly_wednesday: 'Every Wednesday',
  biweekly_sunday: 'Every other Sunday',
}

// Supabase rows store colors as hex codes and icons as lowercase names.
// Fallback data already uses the UI's named colors and PascalCase icon names.
const COLOR_MAP = {
  '#ffffff': 'white',
  '#4caf7d': 'green',
  '#5b8cff': 'blue',
  '#a78bfa': 'purple',
  '#f97316': 'orange',
}

const ICON_MAP = {
  cross: 'Cross',
  bolt: 'Zap',
  home: 'Home',
  hands: 'HandHeart',
  star: 'Star',
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// ISO week number, used to determine "even" weeks for biweekly events.
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

function isEvenWeek(date) {
  return getISOWeek(date) % 2 === 0
}

// Returns the next Date this event occurs on, on or after `from`. Returns null
// for one-off events whose event_date has already passed.
export function getNextOccurrence(event, from = new Date()) {
  const fromDate = startOfDay(from)
  const weekday = RECURRING_WEEKDAY[event.recurring]

  if (weekday !== undefined) {
    const date = new Date(fromDate)
    while (date.getDay() !== weekday) date.setDate(date.getDate() + 1)
    if (event.recurring === 'biweekly_sunday') {
      while (!isEvenWeek(date)) date.setDate(date.getDate() + 7)
    }
    return date
  }

  if (event.event_date) {
    const date = new Date(`${event.event_date}T00:00:00`)
    return date >= fromDate ? date : null
  }

  return null
}

// Returns the day-of-month numbers this event occurs on, for the given month.
export function getOccurrencesInMonth(event, year, month) {
  const days = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekday = RECURRING_WEEKDAY[event.recurring]

  if (weekday !== undefined) {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (date.getDay() !== weekday) continue
      if (event.recurring === 'biweekly_sunday' && !isEvenWeek(date)) continue
      days.push(day)
    }
    return days
  }

  if (event.event_date) {
    const date = new Date(`${event.event_date}T00:00:00`)
    if (date.getFullYear() === year && date.getMonth() === month) days.push(date.getDate())
  }

  return days
}

// Maps a raw event row's `color` field to the UI's named color key.
export function normalizeColor(color) {
  return COLOR_MAP[color] ?? color
}

// Converts a raw event row (Supabase or fallback data) into the shape used by the UI.
export function normalizeEvent(event, occurrenceDate) {
  const date =
    occurrenceDate ?? getNextOccurrence(event) ?? (event.event_date ? new Date(`${event.event_date}T00:00:00`) : new Date())
  const dateLabel = RECURRING_LABELS[event.recurring] ?? formatLongDate(event.event_date)

  return {
    id: event.id,
    name: event.title,
    type: event.type,
    typeLabel: capitalize(event.type),
    color: normalizeColor(event.color),
    icon: ICON_MAP[event.icon] ?? event.icon,
    day: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    subtitle: `${dateLabel} · ${event.location}`,
    date: dateLabel,
    time: formatTime12h(event.start_time),
    location: event.location,
    audience: event.audience,
    description: event.description,
  }
}

// Returns this week's (or next, if today is past Wednesday) Wednesday as YYYY-MM-DD.
export function getNextWednesday() {
  const date = new Date()
  date.setDate(date.getDate() + ((3 - date.getDay() + 7) % 7))
  return date.toISOString().slice(0, 10)
}
