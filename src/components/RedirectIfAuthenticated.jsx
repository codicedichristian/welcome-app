import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStatus } from '../lib/auth.js'

export default function RedirectIfAuthenticated() {
  const status = useAuthStatus()

  if (status === 'authenticated') return <Navigate to="/" replace />
  return <Outlet />
}
