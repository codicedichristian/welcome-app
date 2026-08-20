import { normalizeInterests } from '../utils/normalizeInterests.js'

export const INTERESTS = [
  'Worship',
  'Prayer',
  'Bible study',
  'Youth',
  'Kids & Children',
  'Missions',
  'Community',
  'Music',
  'Arts & Creative',
  'Social action',
  'Leadership',
  'Family & Marriage',
  'Small groups',
  'Women Events',
  'Men Events',
  'Volunteering',
]

const MIGRATION_MAP = {
  'Kids ministry': 'Kids & Children',
  'Children': 'Kids & Children',
  'Families': 'Family & Marriage',
  'Marriage & Family': 'Family & Marriage',
  'Women': 'Women Events',
  'Men': 'Men Events',
}

export function migrateInterests(raw) {
  return normalizeInterests(raw).map((i) => MIGRATION_MAP[i] ?? i)
}
