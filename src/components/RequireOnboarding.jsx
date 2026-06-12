import { Navigate, Outlet } from 'react-router-dom'

export default function RequireOnboarding() {
  const isRegistered = localStorage.getItem('welcome_user')
  return isRegistered ? <Outlet /> : <Navigate to="/onboarding" replace />
}
