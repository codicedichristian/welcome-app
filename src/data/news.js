// Fallback data for news/announcements, matching the shape of the Supabase
// `news` table. Used when Supabase is unreachable.
export const news = [
  {
    id: 1,
    category: 'Announcement',
    color: '#5b8cff',
    published_at: '2026-06-10',
    title: 'Summer camp — sign up open',
    body: "Registration is now open for all ages. This year's camp will be held in the Sierra de Guadarrama from July 14 to 18. Spots are limited so sign up as soon as possible. It's going to be an amazing week of community, worship and outdoor activities.",
  },
  {
    id: 2,
    category: 'Event',
    color: '#4caf7d',
    published_at: '2026-06-08',
    title: "Women's Retreat — June 20",
    body: "A special day for all the women of the church. We'll meet at Casa de Retiro at 10:00 AM for a day of reflection, prayer and fellowship. Lunch is included. Please confirm your attendance by June 15.",
  },
  {
    id: 3,
    category: 'General',
    color: '#666',
    published_at: '2026-06-05',
    title: 'New midweek group in Vallecas',
    body: "We're excited to announce a new midweek home group in the Vallecas area, hosted by Pedro & Lucia. If you live in that zone, this is a great opportunity to connect with people close to you.",
  },
  {
    id: 4,
    category: 'Announcement',
    color: '#5b8cff',
    published_at: '2026-06-01',
    title: 'Sunday service time change',
    body: 'Starting June 15, our Sunday service will begin at 10:30 AM instead of 10:00 AM. Please update your calendars and let your friends know.',
  },
]

export function getNewsById(id) {
  return news.find((item) => String(item.id) === String(id))
}
