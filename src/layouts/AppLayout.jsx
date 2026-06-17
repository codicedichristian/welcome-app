import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from '../components/BottomNav.jsx'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-dvh bg-bg pt-[env(safe-area-inset-top)] text-primary">
      <main style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        <div key={location.key} className="animate-fade-in">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
