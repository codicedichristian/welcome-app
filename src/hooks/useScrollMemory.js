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

    // Guard: only restore once per mount
    if (restoredKeys.has(storageKey)) {
      let lastScrollY = currentScrollY
      let stableTimer = null

      const saveToLive = (y) => {
        currentScrollY = y
        sessionStorage.setItem(`${storageKey}_live`, String(y))
      }

      const onScrollEnd = () => saveToLive(getScrollY())

      const onScroll = () => {
        const y = getScrollY()
        lastScrollY = y
        if (stableTimer) clearTimeout(stableTimer)
        stableTimer = setTimeout(() => saveToLive(getScrollY()), 150)
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
        sessionStorage.setItem(`${storageKey}_live`, String(getScrollY()))
      }
    }

    const flag = key === 'home' && sessionStorage.getItem('returning_to_home') === 'true'
    const manualRestoreRequested = sessionStorage.getItem('use_manual_restore') === 'true'
    const shouldRestore = flag && manualRestoreRequested

    if (shouldRestore) {
      restoredKeys.add(storageKey)
      if (flag) sessionStorage.removeItem('returning_to_home')
      sessionStorage.removeItem('use_manual_restore')
      const saved = sessionStorage.getItem(`${storageKey}_saved`) || sessionStorage.getItem(`${storageKey}_live`)
      sessionStorage.removeItem(`${storageKey}_saved`)

      if (saved) {
        // POP: iOS needs time to stabilize after history navigation
        // non-POP: page already rendered, use double rAF
        const delay = navType === 'POP' ? 200 : 0

        if (delay === 0) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
              document.documentElement.scrollTop = parseInt(saved, 10)
            })
          })
        } else {
          timer = setTimeout(() => {
            window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
            document.documentElement.scrollTop = parseInt(saved, 10)
          }, delay)
        }
      }
    }

    let lastScrollY = currentScrollY
    let stableTimer = null

    const saveToLive = (y) => {
      currentScrollY = y
      sessionStorage.setItem(`${storageKey}_live`, String(y))
    }

    const onScrollEnd = () => saveToLive(getScrollY())

    const onScroll = () => {
      const y = getScrollY()
      lastScrollY = y
      if (stableTimer) clearTimeout(stableTimer)
      stableTimer = setTimeout(() => saveToLive(getScrollY()), 150)
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
      sessionStorage.setItem(`${storageKey}_live`, String(getScrollY()))
    }
  }, [navType, storageKey])
}
