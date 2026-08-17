import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const scrollPositions = new Map()

export function useScrollMemory() {
  const { pathname } = useLocation()

  useEffect(() => {
    const saved = scrollPositions.get(pathname)
    if (saved != null) {
      window.scrollTo({ top: saved, behavior: 'instant' })
    }
    return () => {
      scrollPositions.set(pathname, window.scrollY)
    }
  }, [pathname])
}
