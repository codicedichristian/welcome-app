import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const getScrollY = () => window.scrollY || document.documentElement.scrollTop || 0

export function useScrollMemory(key) {
  const location = useLocation()
  const navType = useNavigationType()
  const storageKey = `scroll_${key || location.pathname}`

  useEffect(() => {
    let timer

    // LOG 1 — effect entry
    console.log('[useScrollMemory] effect ran', {
      key,
      navType,
      storageKey,
      flag_raw: sessionStorage.getItem('returning_to_home'),
      saved_raw: sessionStorage.getItem(storageKey),
      windowScrollY: window.scrollY,
      docScrollTop: document.documentElement.scrollTop,
    })

    const flag = key === 'home' && sessionStorage.getItem('returning_to_home') === 'true'
    const shouldRestore = navType === 'POP' || flag

    // LOG 2 — decision
    console.log('[useScrollMemory] shouldRestore:', shouldRestore, '| flag:', flag, '| navType:', navType)

    if (shouldRestore) {
      if (flag) sessionStorage.removeItem('returning_to_home')
      const saved = sessionStorage.getItem(storageKey)

      // LOG 3 — what value will be restored
      console.log('[useScrollMemory] saved position:', saved, '| will scroll:', saved !== null)

      if (saved) {
        timer = setTimeout(() => {
          // LOG 4 — timer fired
          console.log('[useScrollMemory] setTimeout fired, scrolling to', parseInt(saved, 10),
            '| current scrollY at fire time:', window.scrollY)

          window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
          document.documentElement.scrollTop = parseInt(saved, 10)

          // LOG 5 — after scroll call
          console.log('[useScrollMemory] after scrollTo — scrollY:', window.scrollY,
            '| docScrollTop:', document.documentElement.scrollTop)
        }, 200)
      }
    }

    let currentScrollY = getScrollY()
    const updateScroll = () => {
      currentScrollY = getScrollY()
    }
    window.addEventListener('scroll', updateScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', updateScroll)
      sessionStorage.setItem(storageKey, String(currentScrollY))
    }
  }, [navType, storageKey])
}
