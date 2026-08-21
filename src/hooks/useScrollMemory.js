import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const getScrollY = () => window.scrollY || document.documentElement.scrollTop || 0

export function useScrollMemory(key) {
  const location = useLocation()
  const navType = useNavigationType()
  const storageKey = `scroll_${key || location.pathname}`

  useEffect(() => {
    const flag = sessionStorage.getItem('returning_to_home') === 'true'
    const shouldRestore = navType === 'POP' || flag
    if (shouldRestore) {
      if (flag) sessionStorage.removeItem('returning_to_home')
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
