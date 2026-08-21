import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const getScrollY = () => window.scrollY || document.documentElement.scrollTop || 0

export function useScrollMemory(key) {
  const location = useLocation()
  const navType = useNavigationType()
  const storageKey = `scroll_${key || location.pathname}`

  useEffect(() => {
    if (navType === 'POP') {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
          })
        })
      }
    }

    const saveScroll = () => {
      sessionStorage.setItem(storageKey, String(getScrollY()))
    }
    window.addEventListener('scroll', saveScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', saveScroll)
    }
  }, [navType, storageKey])
}
