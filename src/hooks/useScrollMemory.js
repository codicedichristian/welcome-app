import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const getScrollY = () => window.scrollY || document.documentElement.scrollTop || 0

const restoredKeys = new Set()

export function useScrollMemory(key) {
  const location = useLocation()
  const navType = useNavigationType()
  const storageKey = `scroll_${key || location.pathname}`

  useEffect(() => {
    let timer
    let currentScrollY = getScrollY()

    // LOG 1 — effect entry
    console.log('[useScrollMemory] effect ran', {
      key,
      navType,
      storageKey,
      flag_raw: sessionStorage.getItem('returning_to_home'),
      saved_explicit: sessionStorage.getItem(`${storageKey}_saved`),
      saved_live: sessionStorage.getItem(`${storageKey}_live`),
      windowScrollY: window.scrollY,
      docScrollTop: document.documentElement.scrollTop,
    })

    // Guard: only restore once per mount
    if (restoredKeys.has(storageKey)) {
      let lastScrollY = currentScrollY
      let stableTimer = null

      const saveToLive = (y) => {
        currentScrollY = y
        sessionStorage.setItem(`${storageKey}_live`, String(y))
        console.log('[scroll save] position:', y, 'key:', `${storageKey}_live`)
      }

      const onScrollEnd = () => {
        const y = getScrollY()
        saveToLive(y)
        console.log('[scrollend] final position:', y)
      }

      const onScroll = () => {
        const y = getScrollY()
        lastScrollY = y
        if (stableTimer) clearTimeout(stableTimer)
        stableTimer = setTimeout(() => {
          const finalY = getScrollY()
          saveToLive(finalY)
          console.log('[scroll stable] final position:', finalY)
        }, 150)
      }

      const supportsScrollEnd = 'onscrollend' in window
      if (supportsScrollEnd) {
        window.addEventListener('scrollend', onScrollEnd, { passive: true })
        window.addEventListener('scroll', onScroll, { passive: true })
      } else {
        window.addEventListener('scroll', onScroll, { passive: true })
      }

      return () => {
        clearTimeout(stableTimer)
        window.removeEventListener('scrollend', onScrollEnd)
        window.removeEventListener('scroll', onScroll)
        const finalY = getScrollY()
        sessionStorage.setItem(`${storageKey}_live`, String(finalY))
        console.log('[cleanup] saved position:', finalY)
      }
    }

    const flag = key === 'home' && sessionStorage.getItem('returning_to_home') === 'true'
    const manualRestoreRequested = sessionStorage.getItem('use_manual_restore') === 'true'
    const shouldRestore = flag && manualRestoreRequested

    // LOG 2 — decision
    console.log('[useScrollMemory] shouldRestore:', shouldRestore, '| flag:', flag, '| navType:', navType)
    console.log('[restore decision]', { flag, manualRestoreRequested, shouldRestore })

    if (shouldRestore) {
      restoredKeys.add(storageKey)
      if (flag) sessionStorage.removeItem('returning_to_home')
      sessionStorage.removeItem('use_manual_restore')
      const saved = sessionStorage.getItem(`${storageKey}_saved`) || sessionStorage.getItem(`${storageKey}_live`)
      sessionStorage.removeItem(`${storageKey}_saved`)

      // LOG 3 — what value will be restored
      console.log('[useScrollMemory] saved position:', saved, '| will scroll:', saved !== null)

      if (saved) {
        // POP (back/swipe): iOS needs 200ms to stabilize after history navigation
        // REPLACE (FloatingNav tab): page already rendered, restore immediately
        const delay = navType === 'POP' ? 200 : 0

        if (delay === 0) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // LOG 4 — double rAF fired
              console.log('[useScrollMemory] double rAF fired, scrolling to', parseInt(saved, 10),
                '| current scrollY at fire time:', window.scrollY)

              window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
              document.documentElement.scrollTop = parseInt(saved, 10)

              // LOG 5 — after scroll call
              console.log('[useScrollMemory] after scrollTo — scrollY:', window.scrollY,
                '| docScrollTop:', document.documentElement.scrollTop)
            })
          })
        } else {
          timer = setTimeout(() => {
            // LOG 4 — timer fired
            console.log('[useScrollMemory] setTimeout fired, scrolling to', parseInt(saved, 10),
              '| current scrollY at fire time:', window.scrollY)

            window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
            document.documentElement.scrollTop = parseInt(saved, 10)

            // LOG 5 — after scroll call
            console.log('[useScrollMemory] after scrollTo — scrollY:', window.scrollY,
              '| docScrollTop:', document.documentElement.scrollTop)
          }, delay)
        }
      }
    }

    let lastScrollY = currentScrollY
    let stableTimer = null

    const saveToLive = (y) => {
      currentScrollY = y
      sessionStorage.setItem(`${storageKey}_live`, String(y))
      console.log('[scroll save] position:', y, 'key:', `${storageKey}_live`)
    }

    const onScrollEnd = () => {
      const y = getScrollY()
      saveToLive(y)
      console.log('[scrollend] final position:', y)
    }

    const onScroll = () => {
      const y = getScrollY()
      lastScrollY = y
      if (stableTimer) clearTimeout(stableTimer)
      stableTimer = setTimeout(() => {
        const finalY = getScrollY()
        saveToLive(finalY)
        console.log('[scroll stable] final position:', finalY)
      }, 150)
    }

    const supportsScrollEnd = 'onscrollend' in window
    if (supportsScrollEnd) {
      window.addEventListener('scrollend', onScrollEnd, { passive: true })
      window.addEventListener('scroll', onScroll, { passive: true })
    } else {
      window.addEventListener('scroll', onScroll, { passive: true })
    }

    return () => {
      restoredKeys.delete(storageKey)
      clearTimeout(timer)
      clearTimeout(stableTimer)
      window.removeEventListener('scrollend', onScrollEnd)
      window.removeEventListener('scroll', onScroll)
      const finalY = getScrollY()
      sessionStorage.setItem(`${storageKey}_live`, String(finalY))
      console.log('[cleanup] saved position:', finalY)
    }
  }, [navType, storageKey])
}
