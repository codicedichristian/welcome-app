import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStatus } from '../lib/auth.js'
import Spinner from './Spinner.jsx'

export default function RequireAuth() {
  const status = useAuthStatus()

  if (status === 'loading') return <Spinner />
  if (status === 'authenticated') return <Outlet />
  return <Navigate to="/login" replace />
}
