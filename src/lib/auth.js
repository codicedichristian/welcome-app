import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { getUserByAuthId } from './api.js'
import { toStoredUser } from './user.js'

export function getCurrentUser() {
  return supabase.auth.getUser()
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
