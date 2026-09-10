import { useEffect, useRef, useState } from 'react'

export function usePullToRefresh(onRefresh, { threshold = 80 } = {}) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(null)

  useEffect(() => {
    const el = document.documentElement

    function onTouchStart(e) {
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    function onTouchMove(e) {
      if (startY.current === null) return
      const dist = e.touches[0].clientY - startY.current
      if (dist > 0 && el.scrollTop === 0) {
        setPulling(true)
        setPullDistance(Math.min(dist, threshold * 1.5))
        if (dist > 10) e.preventDefault()
      }
    }

    function onTouchEnd() {
      if (pulling && pullDistance >= threshold) {
        setRefreshing(true)
        Promise.resolve(onRefresh()).finally(() => {
          setRefreshing(false)
        })
      }
      setPulling(false)
      setPullDistance(0)
      startY.current = null
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [onRefresh, pulling, pullDistance, threshold])

  return { pulling, pullDistance, refreshing }
}
