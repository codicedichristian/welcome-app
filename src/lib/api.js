import { supabase } from './supabase.js'

// AUTH

export async function logGdprConsent(userId, consentsState, action = 'registration') {
  let ip = 'unknown'
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const json = await res.json()
    ip = json.ip
  } catch {}
  return supabase.from('gdpr_consent_logs').insert({
    user_id: userId,
    ip_address: ip,
    privacy_policy_version: 'v1.0',
    consents_state: consentsState,
    action,
  })
}

// New visitor registration for the pre-login welcome flow
export async function registerVisitor(form) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
  })
  if (authError) return { user: null, authId: null, error: authError }

  const authId = authData.user?.id
  const nameParts = form.fullName.trim().split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || ''

  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .insert({
      auth_id: authId,
      first_name: firstName,
      last_name: lastName,
      email: form.email,
      age_range: String(form.age),
      interests: form.interests,
      how_found_us: form.howFoundUs,
      privacy_accepted: true,
      marketing_consent: form.marketingConsent ?? false,
      profiling_consent: form.profilingConsent ?? false,
      privacy_policy_version: 'v1.0',
      role: 'visitor',
    })
    .select()
    .single()

  if (!dbError && dbUser) {
    await logGdprConsent(dbUser.id, {
      privacy_accepted: true,
      marketing_consent: form.marketingConsent ?? false,
      profiling_consent: form.profilingConsent ?? false,
      how_found_us: form.howFoundUs,
      timestamp: new Date().toISOString(),
      privacy_policy_version: 'v1.0',
    }, 'registration')
  }

  return { user: dbUser, authId, error: dbError }
}

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

export async function deleteRsvp(userId, eventId) {
  try {
    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
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

// ADMIN: MEMBERS

export async function adminGetMembers() {
  try {
    const [
      { data: users, error: usersError },
      { data: assignments },
      { data: leaders },
      { data: midweekLeaders },
      { data: midweekMembers },
    ] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('service_assignments').select('user_id, area_id, service_areas(id, name, is_macro, parent_id)'),
      supabase.from('area_leaders').select('user_id, area_id, service_areas(id, name, is_macro)'),
      supabase.from('midweek_leaders').select('user_id, group_id, midweek_groups(id, host, zone)'),
      supabase.from('midweek_members').select('user_id, midweek_id, midweek_groups(id, host, zone)'),
    ])

    if (usersError) throw usersError

    const map = new Map(
      (users ?? []).map((u) => [
        u.id,
        { ...u, serviceAreas: [], leadingAreas: [], midweekGroup: null, isMidweekLeader: false, memberGroup: null },
      ]),
    )

    for (const a of assignments ?? []) {
      const u = map.get(a.user_id)
      if (u && a.service_areas) u.serviceAreas.push(a.service_areas)
    }
    for (const l of leaders ?? []) {
      const u = map.get(l.user_id)
      if (u && l.service_areas) u.leadingAreas.push(l.service_areas)
    }
    for (const ml of midweekLeaders ?? []) {
      const u = map.get(ml.user_id)
      if (u && ml.midweek_groups) {
        u.midweekGroup = ml.midweek_groups
        u.isMidweekLeader = true
      }
    }
    for (const mm of midweekMembers ?? []) {
      const u = map.get(mm.user_id)
      if (u && mm.midweek_groups) u.memberGroup = mm.midweek_groups
    }

    return { data: [...map.values()], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminUpdateUserRole(userId, role) {
  try {
    const { data, error } = await supabase.from('users').update({ role }).eq('id', userId).select().single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminGetServiceAreas() {
  try {
    const { data, error } = await supabase.from('service_areas').select('*').order('name')
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminAssignServiceArea(userId, areaId) {
  try {
    const { error } = await supabase
      .from('service_assignments')
      .insert({ user_id: userId, area_id: areaId })
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function adminRemoveServiceArea(userId, areaId) {
  try {
    const { error } = await supabase
      .from('service_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('area_id', areaId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function adminToggleAreaLeader(userId, areaId, isLeader) {
  try {
    if (isLeader) {
      const { error } = await supabase
        .from('area_leaders')
        .upsert({ user_id: userId, area_id: areaId }, { onConflict: 'user_id,area_id' })
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('area_leaders')
        .delete()
        .eq('user_id', userId)
        .eq('area_id', areaId)
      if (error) throw error
    }
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function adminAssignMidweekLeader(userId, groupId) {
  try {
    const { error } = await supabase
      .from('midweek_leaders')
      .upsert({ user_id: userId, group_id: groupId }, { onConflict: 'group_id' })
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function adminRemoveMidweekLeader(groupId) {
  try {
    const { error } = await supabase.from('midweek_leaders').delete().eq('group_id', groupId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function adminAssignMidweekGroup(userId, groupId) {
  try {
    const { error } = await supabase
      .from('midweek_members')
      .upsert({ user_id: userId, midweek_id: groupId }, { onConflict: 'user_id' })
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function adminRemoveMidweekGroup(userId) {
  try {
    const { error } = await supabase.from('midweek_members').delete().eq('user_id', userId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// ADMIN: SCHEDULES

export async function adminGetSchedules() {
  try {
    const { data, error } = await supabase
      .from('sunday_schedules')
      .select('*, service_responses(status)')
      .order('date', { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminGetScheduleDates() {
  try {
    const { data, error } = await supabase
      .from('sunday_schedules')
      .select('id, date, title, arrival_time, notes, document_url')
      .order('date', { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminGetSundays() {
  try {
    const { data, error } = await supabase
      .from('sunday_summaries')
      .select('*, schedule:sunday_schedules!schedule_id(id, date)')
    if (error) throw error
    const sorted = (data ?? []).sort((a, b) => {
      const da = a.schedule?.date ?? ''
      const db = b.schedule?.date ?? ''
      return db.localeCompare(da)
    })
    return { data: sorted, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminDeleteSummary(id) {
  try {
    const { error } = await supabase.from('sunday_summaries').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function adminCreateSchedules(dates, meta = {}) {
  try {
    const { data: schedules, error: scheduleError } = await supabase
      .from('sunday_schedules')
      .insert(dates.map((date) => ({
        date,
        title: meta.title || null,
        arrival_time: meta.arrival_time || null,
        notes: meta.notes || null,
        document_url: meta.document_url || null,
      })))
      .select()
    if (scheduleError) throw scheduleError

    const { data: assignments } = await supabase.from('service_assignments').select('user_id, area_id')

    if (schedules?.length && assignments?.length) {
      const responses = schedules.flatMap((s) =>
        assignments.map((a) => ({
          schedule_id: s.id,
          user_id: a.user_id,
          area_id: a.area_id,
          status: 'pending',
        })),
      )
      await supabase.from('service_responses').insert(responses)
    }

    return { data: schedules, assignmentCount: assignments?.length ?? 0, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminDeleteSchedule(id) {
  try {
    const { error } = await supabase.from('sunday_schedules').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function adminUpdateSchedule(scheduleId, data) {
  try {
    const { error } = await supabase.from('sunday_schedules').update(data).eq('id', scheduleId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function adminUpsertAreaNote(scheduleId, areaId, authorId, notes) {
  try {
    const { error } = await supabase
      .from('schedule_area_notes')
      .upsert(
        { schedule_id: scheduleId, area_id: areaId, author_id: authorId, notes, updated_at: new Date().toISOString() },
        { onConflict: 'schedule_id,area_id' },
      )
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function adminGetAreaNotes(scheduleId) {
  try {
    const { data, error } = await supabase
      .from('schedule_area_notes')
      .select('*, service_areas(name), author:users!author_id(first_name, last_name)')
      .eq('schedule_id', scheduleId)
    if (error) throw error
    return { data: data ?? [], error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export async function adminGetSummary(scheduleId) {
  try {
    const { data, error } = await supabase
      .from('sunday_summaries')
      .select('*')
      .eq('schedule_id', scheduleId)
      .maybeSingle()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminUpsertSummary(scheduleId, summaryData) {
  try {
    const { data, error } = await supabase
      .from('sunday_summaries')
      .upsert({ schedule_id: scheduleId, ...summaryData }, { onConflict: 'schedule_id' })
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getScheduleRoster(scheduleId, areaId) {
  try {
    const { data, error } = await supabase
      .from('service_responses')
      .select('*, users(id, first_name, last_name, role)')
      .eq('schedule_id', scheduleId)
      .eq('area_id', areaId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminGetScheduleRoster(scheduleId) {
  try {
    const { data, error } = await supabase
      .from('service_responses')
      .select('status, decline_reason, user_id, area_id, users(first_name, last_name), service_areas(id, name)')
      .eq('schedule_id', scheduleId)
    if (error) throw error

    const grouped = {}
    for (const row of data ?? []) {
      const areaId = row.area_id
      if (!grouped[areaId]) grouped[areaId] = { areaName: row.service_areas?.name ?? '', members: [] }
      grouped[areaId].members.push({
        name: `${row.users?.first_name ?? ''} ${row.users?.last_name ?? ''}`.trim(),
        status: row.status,
        declineReason: row.decline_reason ?? null,
      })
    }
    for (const area of Object.values(grouped)) {
      area.members.sort((a, b) => a.name.localeCompare(b.name))
    }
    return { data: grouped, error: null }
  } catch (error) {
    return { data: {}, error }
  }
}

// ADMIN: MESSAGES

export async function adminGetMessages() {
  try {
    const { data, error } = await supabase
      .from('member_messages')
      .select('*, author:users!author_id(first_name, last_name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminCreateMessage(messageData) {
  try {
    const { data, error } = await supabase.from('member_messages').insert(messageData).select().single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function adminDeleteMessage(id) {
  try {
    const { error } = await supabase.from('member_messages').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// ─── MEMBERS AREA ────────────────────────────────────────────────────────────

export async function getMyChurchData(userId) {
  const today = new Date().toISOString().slice(0, 10)
  const [
    { data: leaderEntry },
    { data: memberEntry },
    { data: myAreas },
    { data: nextSchedule },
    { data: allMessages },
    { data: myReads },
    { data: summaries },
  ] = await Promise.all([
    supabase.from('midweek_leaders').select('group_id, midweek_groups(id, host, zone)').eq('user_id', userId).maybeSingle(),
    supabase.from('midweek_members').select('midweek_id, midweek_groups(id, host, zone)').eq('user_id', userId).maybeSingle(),
    supabase.from('service_assignments').select('area_id, service_areas(id, name)').eq('user_id', userId),
    supabase.from('sunday_schedules').select('id, date').gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('member_messages').select('id, audience, title, body').order('created_at', { ascending: false }),
    supabase.from('message_reads').select('message_id').eq('user_id', userId),
    supabase.from('sunday_summaries').select('*, schedule:sunday_schedules!schedule_id(id, date)'),
  ])

  const myGroup = leaderEntry?.midweek_groups ?? memberEntry?.midweek_groups ?? null
  const myAreaIds = new Set((myAreas ?? []).map((a) => a.area_id))
  const readIds = new Set((myReads ?? []).map((r) => r.message_id))

  const isRelevantMsg = (msg) => {
    if (msg.audience === 'all_members') return true
    if (msg.audience?.startsWith('area:') && myAreaIds.has(msg.audience.slice(5))) return true
    if (myGroup?.id && msg.audience === `group:${myGroup.id}`) return true
    return false
  }

  let latestNote = null
  let groupMemberCount = 0
  let nextResponse = null

  if (myGroup?.id) {
    const [{ data: note }, { count }, { data: resp }] = await Promise.all([
      supabase.from('midweek_notes').select('id, title, date').eq('group_id', myGroup.id).order('date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('midweek_leaders').select('*', { count: 'exact', head: true }).eq('group_id', myGroup.id),
      nextSchedule?.id
        ? supabase.from('service_responses').select('status, area_id').eq('user_id', userId).eq('schedule_id', nextSchedule.id).limit(1).maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    latestNote = note
    groupMemberCount = count ?? 0
    nextResponse = resp
  } else if (nextSchedule?.id) {
    const { data: resp } = await supabase.from('service_responses').select('status, area_id').eq('user_id', userId).eq('schedule_id', nextSchedule.id).limit(1).maybeSingle()
    nextResponse = resp
  }

  const relevantMessages = (allMessages ?? []).filter(isRelevantMsg)
  const unreadMessages = relevantMessages.filter((msg) => !readIds.has(msg.id)).length
  const latestMessage = relevantMessages[0] ?? null

  const lastSunday = (summaries ?? [])
    .filter((s) => s.schedule?.date && s.schedule.date <= today)
    .sort((a, b) => (b.schedule?.date ?? '').localeCompare(a.schedule?.date ?? ''))[0] ?? null

  return {
    myGroup, latestNote, myAreas: myAreas ?? [], nextSchedule: nextSchedule ?? null,
    unreadMessages, lastSunday, groupMemberCount, nextResponse, latestMessage,
  }
}

export async function getMyMidweekData(userId) {
  const { data: leaderEntry } = await supabase
    .from('midweek_leaders')
    .select('group_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!leaderEntry?.group_id) return { group: null, leader: null, notes: [] }

  const groupId = leaderEntry.group_id
  const [{ data: group }, { data: leaderLink }, { data: notes }] = await Promise.all([
    supabase.from('midweek_groups').select('*').eq('id', groupId).single(),
    supabase.from('midweek_leaders').select('user_id, users!user_id(first_name, last_name, phone)').eq('group_id', groupId).maybeSingle(),
    supabase.from('midweek_notes').select('*').eq('group_id', groupId).order('date', { ascending: false }).limit(10),
  ])

  return { group: group ?? null, leader: leaderLink?.users ?? null, notes: notes ?? [] }
}

export async function getMyServicesData(userId) {
  const today = new Date().toISOString().slice(0, 10)
  const [{ data: assignments }, { data: leadingAreas }, { data: upcomingRaw }, { data: pastRaw }] = await Promise.all([
    supabase.from('service_assignments').select('area_id, service_areas(id, name, is_macro, parent_id)').eq('user_id', userId),
    supabase.from('area_leaders').select('area_id').eq('user_id', userId),
    supabase.from('sunday_schedules').select('id, date').gte('date', today).order('date', { ascending: true }).limit(8),
    supabase.from('sunday_schedules').select('id, date').lt('date', today).order('date', { ascending: false }).limit(10),
  ])

  const leadingSet = new Set((leadingAreas ?? []).map((a) => a.area_id))
  const upcomingIds = new Set((upcomingRaw ?? []).map((s) => s.id))
  const pastIds = new Set((pastRaw ?? []).map((s) => s.id))

  // Fetch responses, summaries, schedule detail, and area notes (client-side filter; .in() unsupported in mock)
  const [{ data: allResp }, { data: allSummaries }, { data: scheduleInfoRaw }, { data: areaNoteRaw }] = await Promise.all([
    supabase.from('service_responses').select('schedule_id, area_id, status, service_areas(id, name)').eq('user_id', userId),
    supabase.from('sunday_summaries').select('schedule_id, title'),
    supabase.from('sunday_schedules').select('id, title, arrival_time, notes, document_url'),
    supabase.from('schedule_area_notes').select('schedule_id, area_id, notes'),
  ])
  const responses = allResp ?? []
  const summaryMap = new Map((allSummaries ?? []).map((s) => [s.schedule_id, s.title]))
  const scheduleInfoMap = new Map((scheduleInfoRaw ?? []).map((s) => [s.id, s]))
  const areaNoteMap = new Map((areaNoteRaw ?? []).map((n) => [`${n.schedule_id}:${n.area_id}`, n.notes]))

  // Areas with isLeading
  const areas = (assignments ?? []).map((a) => ({
    areaId: a.area_id,
    name: a.service_areas?.name ?? '',
    isLeading: leadingSet.has(a.area_id),
  }))

  // Structured upcoming schedules — only schedules where user has a response
  const upcomingSchedules = (upcomingRaw ?? [])
    .map((s) => {
      const info = scheduleInfoMap.get(s.id)
      return {
        scheduleId: s.id,
        date: s.date,
        title: info?.title ?? summaryMap.get(s.id) ?? null,
        arrivalTime: info?.arrival_time ?? null,
        scheduleNotes: info?.notes ?? null,
        documentUrl: info?.document_url ?? null,
        responses: responses
          .filter((r) => r.schedule_id === s.id)
          .map((r) => ({
            areaId: r.area_id,
            areaName: r.service_areas?.name ?? '',
            status: r.status,
            isLeading: leadingSet.has(r.area_id),
            areaNote: areaNoteMap.get(`${s.id}:${r.area_id}`) ?? null,
          })),
      }
    })
    .filter((s) => s.responses.length > 0)

  // History — past responses, newest first
  const pastDateMap = new Map((pastRaw ?? []).map((s) => [s.id, s.date]))
  const history = responses
    .filter((r) => pastIds.has(r.schedule_id))
    .map((r) => ({
      scheduleId: r.schedule_id,
      date: pastDateMap.get(r.schedule_id),
      areaName: r.service_areas?.name ?? '',
      title: summaryMap.get(r.schedule_id) ?? null,
      status: r.status,
    }))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 10)

  return { areas, upcomingSchedules, history }
}

export async function updateServiceResponse(userId, scheduleId, areaId, status, reason = null) {
  try {
    const { error } = await supabase
      .from('service_responses')
      .update({ status, decline_reason: status === 'declined' ? reason : null })
      .eq('user_id', userId)
      .eq('schedule_id', scheduleId)
      .eq('area_id', areaId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function getSundaySummaries() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('sunday_summaries')
      .select('*, schedule:sunday_schedules!schedule_id(id, date)')
    if (error) throw error
    const past = (data ?? [])
      .filter((s) => s.schedule?.date && s.schedule.date <= today)
      .sort((a, b) => (b.schedule?.date ?? '').localeCompare(a.schedule?.date ?? ''))
      .slice(0, 20)
    return { data: past, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getMemberMessages(userId, userRole) {
  if (userRole === 'visitor') return { data: [], error: null }
  try {
    // Resolve user's area IDs and group ID in parallel
    const [{ data: assignments }, { data: memberRow }, { data: leaderRow }] = await Promise.all([
      supabase.from('service_assignments').select('area_id').eq('user_id', userId),
      supabase.from('midweek_members').select('midweek_id').eq('user_id', userId).maybeSingle(),
      supabase.from('midweek_leaders').select('group_id').eq('user_id', userId).maybeSingle(),
    ])

    const areaIds = new Set((assignments ?? []).map((a) => a.area_id))
    const groupId = memberRow?.midweek_id ?? leaderRow?.group_id ?? null

    const [{ data: messages, error }, { data: reads }, { data: serviceAreas }, { data: groups }] = await Promise.all([
      supabase.from('member_messages').select('*, author:users!author_id(first_name, last_name)').order('created_at', { ascending: false }),
      supabase.from('message_reads').select('message_id').eq('user_id', userId),
      supabase.from('service_areas').select('id, name'),
      supabase.from('midweek_groups').select('id, host'),
    ])
    if (error) throw error

    const readIds = new Set((reads ?? []).map((r) => r.message_id))
    const areaMap = new Map((serviceAreas ?? []).map((a) => [a.id, a.name]))
    const groupMap = new Map((groups ?? []).map((g) => [g.id, g.host]))

    const resolveAudience = (audience) => {
      if (audience === 'all_members') return 'All members'
      if (audience?.startsWith('area:')) {
        const name = areaMap.get(audience.slice(5))
        return name ? `${name} team` : 'Team'
      }
      if (audience?.startsWith('group:')) {
        const host = groupMap.get(audience.slice(6))
        return host ? `${host} group` : 'Group'
      }
      return 'Members'
    }

    const filtered = (messages ?? [])
      .filter((msg) => {
        if (msg.audience === 'all_members') return ['member', 'leader', 'admin'].includes(userRole)
        if (msg.audience?.startsWith('area:')) return areaIds.has(msg.audience.slice(5))
        if (msg.audience?.startsWith('group:')) return groupId === msg.audience.slice(6)
        return false
      })
      .map((msg) => ({
        ...msg,
        authorName: msg.author ? `${msg.author.first_name} ${msg.author.last_name}` : 'Leader',
        audienceLabel: resolveAudience(msg.audience),
        isRead: readIds.has(msg.id),
      }))

    return { data: filtered, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function markMessageRead(userId, messageId) {
  try {
    const { error } = await supabase
      .from('message_reads')
      .upsert({ user_id: userId, message_id: messageId, read_at: new Date().toISOString() }, { onConflict: 'user_id,message_id' })
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
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
