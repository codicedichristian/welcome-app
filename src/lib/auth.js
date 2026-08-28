import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { getUserByAuthId } from './api.js'
import { toStoredUser } from './user.js'

export function getCurrentUser() {
  return supabase.auth.getUser()
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/',
    },
  })
  if (error) console.error('Google OAuth error:', error.message)
}

// Creates a users row for an OAuth user who has no profile yet.
async function createOAuthProfile(authUser) {
  const meta = authUser.user_metadata
  const nameParts = (meta.full_name || meta.name || '').trim().split(' ')
  const { error } = await supabase.from('users').insert({
    auth_id: authUser.id,
    email: authUser.email,
    first_name: nameParts[0] || '',
    last_name: nameParts.slice(1).join(' ') || '',
    role: 'visitor',
    privacy_accepted: true,
    marketing_consent: false,
    profiling_consent: false,
    privacy_policy_version: 'v1.0',
  })
  return error
}

// Fetches the current user from the DB and returns the stored shape.
// Always uses Supabase as source of truth for role. Also updates localStorage cache.
// For OAuth users with no profile yet, creates one automatically.
export async function getCurrentUserWithRole() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  let { data: profile, error } = await getUserByAuthId(session.user.id)

  if (error || !profile) {
    const insertError = await createOAuthProfile(session.user)
    if (insertError) return null
    const { data: newProfile } = await getUserByAuthId(session.user.id)
    if (!newProfile) return null
    profile = newProfile
  }

  const stored = toStoredUser(profile, session.user.id)
  localStorage.setItem('welcome_user', JSON.stringify(stored))
  return stored
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

// Resolves to 'authenticated' or 'unauthenticated' (no session — show login).
// Starts as 'loading'.
export function useAuthStatus() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      const hasLocalUser = Boolean(localStorage.getItem('welcome_user'))

      if (!session) {
        if (!cancelled) setStatus('unauthenticated')
        return
      }

      if (hasLocalUser) {
        if (!cancelled) setStatus('authenticated')
        return
      }

      let { data: profile, error } = await getUserByAuthId(session.user.id)
      if (cancelled) return

      if (error || !profile) {
        // No profile — could be a first-time OAuth user, try to create one
        const insertError = await createOAuthProfile(session.user)
        if (insertError || cancelled) {
          if (!cancelled) setStatus('unauthenticated')
          return
        }
        const { data: newProfile } = await getUserByAuthId(session.user.id)
        if (cancelled) return
        if (!newProfile) {
          setStatus('unauthenticated')
          return
        }
        profile = newProfile
      }

      localStorage.setItem('welcome_user', JSON.stringify(toStoredUser(profile, session.user.id)))
      if (!cancelled) setStatus('authenticated')
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  return status
}
