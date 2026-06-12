import { supabase } from './supabase.js'

// AUTH

export async function registerUser(userData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        age_range: userData.ageRange,
        interests: userData.interests,
        notifications: userData.notifications,
      })
      .select()
      .single()

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
