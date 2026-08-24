import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import RightPanel from '../components/RightPanel.jsx'

export default function AppLayout() {
  const [isRightOpen, setIsRightOpen] = useState(false)
  const openRight = useCallback(() => setIsRightOpen(true), [])

  return (
    <div className="min-h-dvh bg-bg text-primary">
      <main>
        <div className="animate-fade-in">
          <Outlet context={{ openRightPanel: openRight }} />
        </div>
      </main>
      <RightPanel isOpen={isRightOpen} onClose={() => setIsRightOpen(false)} />
    </div>
  )
}
