import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from '../components/BottomNav.jsx'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-dvh bg-bg pt-[env(safe-area-inset-top)] text-primary">
      <main className="pb-[calc(var(--nav-height)+env(safe-area-inset-bottom))]">
        <div key={location.key} className="animate-fade-in">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
