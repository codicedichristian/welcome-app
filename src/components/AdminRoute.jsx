import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { getUserByAuthId } from '../lib/api.js'
import { getStoredUser, toStoredUser } from '../lib/user.js'
import Spinner from './Spinner.jsx'

export default function AdminRoute() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    async function check() {
      const storedUser = getStoredUser()

      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      if (!session) {
        setStatus('unauthenticated')
        return
      }

      if (storedUser.role === 'admin') {
        setStatus('admin')
        return
      }

      const { data: profile, error } = await getUserByAuthId(session.user.id)
      if (cancelled) return

      if (error || !profile) {
        setStatus('unauthenticated')
        return
      }

      localStorage.setItem('welcome_user', JSON.stringify(toStoredUser(profile, session.user.id)))

      setStatus(profile.role === 'admin' ? 'admin' : 'not-admin')
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') return <Spinner />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (status === 'not-admin') return <Navigate to="/" replace />
  return <Outlet />
}
