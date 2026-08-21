import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const getScrollY = () =>
  window.scrollY ||
  document.documentElement.scrollTop ||
  document.body.scrollTop ||
  0

export function useScrollMemory(key) {
  const location = useLocation()
  const navType = useNavigationType()
  const storageKey = `scroll_${key || location.pathname}`

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

    let timer

    const flag = key === 'home' && localStorage.getItem('returning_to_home') === 'true'
    const shouldRestore = navType === 'POP' || flag
    if (shouldRestore) {
      if (flag) localStorage.removeItem('returning_to_home')
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        timer = setTimeout(() => {
          const top = parseInt(saved, 10)
          window.scrollTo({ top, behavior: 'instant' })
          document.documentElement.scrollTop = top
          document.body.scrollTop = top
        }, 300)
      }
    }

    const saveScroll = () => {
      sessionStorage.setItem(storageKey, String(getScrollY()))
    }
    window.addEventListener('scroll', saveScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', saveScroll)
    }
  }, [navType, storageKey])
}
