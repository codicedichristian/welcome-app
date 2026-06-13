import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const RECURRING_WEEKDAY: Record<string, number> = {
  weekly_sunday: 0,
  weekly_monday: 1,
  weekly_wednesday: 3,
  biweekly_sunday: 0,
}

// ISO week number, used to determine "even" weeks for biweekly events.
function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function isEvenWeek(date: Date) {
  return getISOWeek(date) % 2 === 0
}

interface EventRow {
  id: string
  title: string
  location: string | null
  event_date: string | null
  start_time: string
  recurring: string | null
}

// Returns the Date this event starts on today, or null if it doesn't occur today.
function getTodaysOccurrence(event: EventRow, now: Date): Date | null {
  const weekday = event.recurring ? RECURRING_WEEKDAY[event.recurring] : undefined

  if (weekday !== undefined) {
    if (now.getDay() !== weekday) return null
    if (event.recurring === 'biweekly_sunday' && !isEvenWeek(now)) return null
  } else if (event.event_date) {
    const eventDate = new Date(`${event.event_date}T00:00:00`)
    if (eventDate.toDateString() !== now.toDateString()) return null
  } else {
    return null
  }

  const [hours, minutes] = event.start_time.split(':').map(Number)
  const occurrence = new Date(now)
  occurrence.setHours(hours, minutes, 0, 0)
  return occurrence
}

Deno.serve(async (_req) => {
  webpush.setVapidDetails(
    Deno.env.get('VAPID_EMAIL')!,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const now = new Date()
  const windowEnd = new Date(now.getTime() + 60 * 60 * 1000)

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, location, event_date, start_time, recurring')

  if (eventsError) {
    return new Response(JSON.stringify({ error: eventsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const upcoming = (events ?? []).filter((event: EventRow) => {
    const occurrence = getTodaysOccurrence(event, now)
    return occurrence !== null && occurrence >= now && occurrence <= windowEnd
  })

  let sent = 0

  for (const event of upcoming) {
    const { data: rsvps } = await supabase.from('event_rsvps').select('user_id').eq('event_id', event.id)
    if (!rsvps?.length) continue

    const userIds = rsvps.map((rsvp) => rsvp.user_id)

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription')
      .in('user_id', userIds)

    if (!subscriptions?.length) continue

    const payload = JSON.stringify({
      title: event.title,
      body: `Starting in 1 hour at ${event.location}`,
      data: { url: '/events' },
    })

    for (const { user_id, subscription } of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload)
        sent++
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('user_id', user_id)
        }
      }
    }
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})
