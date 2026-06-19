// Fallback data for events, matching the shape of the Supabase `events` table.
// Used when Supabase is unreachable.
export const events = [
  {
    id: 'sunday-service',
    title: 'Sunday Service',
    type: 'sunday',
    color: 'white',
    icon: 'Cross',
    description:
      'Join us for worship, teaching, and community as we gather together every Sunday morning. All are welcome, no matter where you are on your journey.',
    location: 'Main Hall',
    audience: 'Open to everyone',
    recurring: 'weekly_sunday',
    event_date: null,
    start_time: '10:00:00',
    end_time: null,
    image_url: null,
  },
  {
    id: 'youth-night',
    title: 'Youth Night',
    type: 'youth',
    color: 'green',
    icon: 'Zap',
    description:
      'A night of games, worship, and honest conversation for teens. Bring a friend — there is always room for one more.',
    location: 'Room B',
    audience: 'Open to everyone',
    recurring: null,
    event_date: '2026-06-13',
    start_time: '19:00:00',
    end_time: null,
    image_url: null,
  },
  {
    id: 'midweek',
    title: 'Midweek',
    type: 'midweek',
    color: 'blue',
    icon: 'Home',
    description:
      'Smaller groups meeting in homes across the city to dig deeper into the Sunday message, share life, and pray for one another.',
    location: 'Various homes',
    audience: 'Open to everyone',
    recurring: 'weekly_wednesday',
    event_date: null,
    start_time: '19:00:00',
    end_time: null,
    image_url: null,
  },
  {
    id: 'prayer-meeting',
    title: 'Prayer Meeting',
    type: 'prayer',
    color: 'purple',
    icon: 'HandHeart',
    description:
      'Start the week by praying together as a church family. Join from wherever you are — all you need is a few quiet minutes.',
    location: 'Remote/Online',
    audience: 'Open to everyone',
    recurring: 'weekly_monday',
    event_date: null,
    start_time: '09:00:00',
    end_time: null,
    image_url: null,
  },
  {
    id: 'womens-retreat',
    title: "Women's Retreat",
    type: 'special',
    color: 'orange',
    icon: 'Star',
    description:
      'A full day away to rest, connect, and be refreshed together. Meals, activities, and transportation are included.',
    location: 'Casa de Retiro',
    audience: 'Open to everyone',
    recurring: null,
    event_date: '2026-06-20',
    start_time: null,
    end_time: null,
    image_url: null,
  },
]

export function getEventById(id) {
  return events.find((event) => event.id === id)
}
