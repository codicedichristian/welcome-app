import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const scrollPositions = new Map()

// ready: pass !loading so scroll restores only after content is rendered
export function useScrollMemory(ready = true) {
  const { pathname } = useLocation()

  // Restore saved position once the page is ready to scroll
  useEffect(() => {
    if (!ready) return
    const saved = scrollPositions.get(pathname)
    if (saved != null) {
      window.scrollTo({ top: saved, behavior: 'instant' })
    }
  }, [pathname, ready])

  // Save position on unmount (always, regardless of ready)
  useEffect(() => {
    return () => {
      scrollPositions.set(pathname, window.scrollY)
    }
  }, [pathname])
}
