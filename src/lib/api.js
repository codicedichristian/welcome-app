import { supabase } from './supabase.js'

// AUTH

export async function registerUser(userData) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  })

  console.log('Supabase signUp result:', { data: authData, error: authError })

  if (authError) {
    return { user: null, authId: null, error: authError }
  }

  const authId = authData.user?.id

  const insertPayload = {
    auth_id: authId,
    first_name: userData.firstName,
    last_name: userData.lastName,
    email: userData.email,
    phone: userData.phone,
    age_range: userData.ageRange,
    interests: userData.interests,
    notifications: userData.notifications,
  }

  console.log('Inserting user to DB:', insertPayload)

  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .insert(insertPayload)
    .select()
    .single()

  console.log('DB insert result:', { data: dbUser, error: dbError })

  return { user: dbUser, authId, error: dbError }
}

export async function getUserByAuthId(authId) {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('auth_id', authId).single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateUser(userId, userData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        age_range: userData.ageRange,
        interests: userData.interests,
        notifications: userData.notifications,
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// PUSH SUBSCRIPTIONS

export async function saveSubscription(userId, subscription) {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({ user_id: userId, subscription: subscription.toJSON() })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteSubscription(userId) {
  try {
    const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', userId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// EVENTS

export async function getEvents() {
  try {
    const { data, error } = await supabase.from('events').select('*')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function rsvpEvent(userId, eventId) {
  try {
    const { data, error } = await supabase
      .from('event_rsvps')
      .insert({ user_id: userId, event_id: eventId })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getUserRsvps(userId) {
  try {
    const { data, error } = await supabase
      .from('event_rsvps')
      .select('*, event:events(*)')
      .eq('user_id', userId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// MIDWEEK

export async function getMidweekGroups() {
  try {
    const { data, error } = await supabase
      .from('midweek_groups')
      .select('*')
      .eq('active', true)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getUserMidweekRsvp(userId) {
  try {
    const { data, error } = await supabase
      .from('midweek_rsvps')
      .select('*, group:midweek_groups(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function rsvpMidweek(userId, groupId, weekDate) {
  try {
    const { data, error } = await supabase
      .from('midweek_rsvps')
      .insert({ user_id: userId, group_id: groupId, week_date: weekDate })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// NEWS

export async function getNews() {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ADMIN: EVENTS

export async function adminGetEvents() {
  try {
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminCreateEvent(eventData) {
  try {
    const { data, error } = await supabase.from('events').insert(eventData).select().single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminUpdateEvent(id, eventData) {
  try {
    const { data, error } = await supabase.from('events').update(eventData).eq('id', id).select().single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminDeleteEvent(id) {
  try {
    const { error } = await supabase.from('events').delete().eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// ADMIN: NEWS

export async function adminGetNews() {
  try {
    const { data, error } = await supabase.from('news').select('*').order('published_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminCreateNews(newsData) {
  try {
    const { data, error } = await supabase.from('news').insert(newsData).select().single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminUpdateNews(id, newsData) {
  try {
    const { data, error } = await supabase.from('news').update(newsData).eq('id', id).select().single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminDeleteNews(id) {
  try {
    const { error } = await supabase.from('news').delete().eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// ADMIN: MIDWEEK GROUPS

export async function adminGetMidweekGroups() {
  try {
    const { data, error } = await supabase
      .from('midweek_groups')
      .select('*, midweek_rsvps(count)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminCreateMidweekGroup(groupData) {
  try {
    const { data, error } = await supabase.from('midweek_groups').insert(groupData).select().single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminUpdateMidweekGroup(id, groupData) {
  try {
    const { data, error } = await supabase.from('midweek_groups').update(groupData).eq('id', id).select().single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminDeleteMidweekGroup(id) {
  try {
    const { error } = await supabase.from('midweek_groups').delete().eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// ADMIN: MEMBERS & DASHBOARD

export async function adminGetMembers() {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminGetStats() {
  try {
    const [
      { count: totalMembers, error: membersError },
      { data: events, error: eventsError },
      { count: totalNews, error: newsError },
      { count: activeMidweekGroups, error: midweekError },
      { data: recentMembers, error: recentError },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*'),
      supabase.from('news').select('*', { count: 'exact', head: true }),
      supabase.from('midweek_groups').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('users').select('first_name, last_name, email, created_at').order('created_at', { ascending: false }).limit(5),
    ])

    const error = membersError || eventsError || newsError || midweekError || recentError
    if (error) throw error

    return {
      data: {
        totalMembers: totalMembers ?? 0,
        events: events ?? [],
        totalNews: totalNews ?? 0,
        activeMidweekGroups: activeMidweekGroups ?? 0,
        recentMembers: recentMembers ?? [],
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}
