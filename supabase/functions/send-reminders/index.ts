import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

webpush.setVapidDetails(
  Deno.env.get('VAPID_EMAIL')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

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

Deno.serve(async (_req) => {
  console.log('send-reminders started at', new Date().toISOString())

  // Get current time and time + 1 hour
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const nowTime = now.toTimeString().slice(0, 5) // "HH:MM"
  const laterTime = oneHourLater.toTimeString().slice(0, 5)
  const today = now.toISOString().slice(0, 10) // "YYYY-MM-DD"
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon, 3=Wed

  console.log('Looking for events between', nowTime, 'and', laterTime)

  // Fetch all events
  const { data: events, error: eventsError } = await supabase.from('events').select('*')

  if (eventsError) {
    console.error('Error fetching events:', eventsError)
    return new Response(JSON.stringify({ error: eventsError.message }), { status: 500 })
  }

  console.log('Total events found:', events.length)

  // Filter events happening in next hour
  const upcomingEvents = events.filter((event) => {
    const eventTime = event.start_time?.slice(0, 5)
    if (!eventTime) return false

    // Check if time is in range
    const inTimeRange = eventTime >= nowTime && eventTime <= laterTime
    if (!inTimeRange) return false

    // Check recurrence
    if (event.recurring === 'weekly_sunday') return dayOfWeek === 0
    if (event.recurring === 'weekly_monday') return dayOfWeek === 1
    if (event.recurring === 'weekly_wednesday') return dayOfWeek === 3
    if (event.recurring === 'biweekly_sunday') return dayOfWeek === 0 && isEvenWeek(now)
    if (!event.recurring) return event.event_date === today

    return false
  })

  console.log('Upcoming events in next hour:', upcomingEvents.length)

  // Also include test events (event_date = today, type = 'special') for manual testing
  const testEvents = events.filter((event) => event.event_date === today && event.type === 'special')
  console.log('Test events today:', testEvents.length)

  const eventsToNotify = [...upcomingEvents, ...testEvents].filter(
    (event, index, all) => all.findIndex((other) => other.id === event.id) === index,
  )
  console.log('Events to notify:', eventsToNotify.map((event) => event.title))

  // Get all push subscriptions
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*, users(id, first_name)')

  if (subError) {
    console.error('Error fetching subscriptions:', subError)
    return new Response(JSON.stringify({ error: subError.message }), { status: 500 })
  }

  console.log('Total push subscriptions:', subscriptions.length)

  let sent = 0
  let failed = 0

  for (const event of eventsToNotify) {
    for (const sub of subscriptions) {
      try {
        const payload = JSON.stringify({
          title: event.title,
          body: `Starting at ${event.start_time?.slice(0, 5)} · ${event.location}`,
          data: { url: '/events' },
        })

        await webpush.sendNotification(sub.subscription, payload)
        sent++
        console.log('Notification sent to user:', sub.users?.first_name, 'for event:', event.title)
      } catch (err) {
        failed++
        console.error('Failed to send to user:', sub.users?.first_name, err.message)

        // Remove invalid subscription
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          console.log('Removed invalid subscription:', sub.id)
        }
      }
    }
  }

  console.log('Done. Sent:', sent, 'Failed:', failed)

  return new Response(JSON.stringify({ sent, failed, events: eventsToNotify.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
