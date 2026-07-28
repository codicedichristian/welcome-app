import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { getUserByAuthId } from './api.js'
import { toStoredUser } from './user.js'

export function getCurrentUser() {
  return supabase.auth.getUser()
}

// Fetches the current user from the DB and returns the stored shape.
// Always uses Supabase as source of truth for role. Also updates localStorage cache.
export async function getCurrentUserWithRole() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data: profile, error } = await getUserByAuthId(session.user.id)
  if (error || !profile) return null
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

      const { data: profile, error } = await getUserByAuthId(session.user.id)
      if (cancelled) return

      if (error || !profile) {
        setStatus('unauthenticated')
        return
      }

      localStorage.setItem('welcome_user', JSON.stringify(toStoredUser(profile, session.user.id)))
      setStatus('authenticated')
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  return status
}
