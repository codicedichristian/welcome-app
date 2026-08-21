import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useScrollMemory(key) {
  const location = useLocation()
  const storageKey = `scroll_${key || location.pathname}`

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey)
    if (saved) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
        })
      })
    }

    const saveScroll = () => {
      sessionStorage.setItem(storageKey, String(window.scrollY))
    }
    window.addEventListener('scroll', saveScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', saveScroll)
    }
  }, [storageKey])
}
