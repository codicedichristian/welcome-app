import { useEffect, useRef, useState, useCallback } from 'react'

export function usePullToRefresh(onRefresh, { threshold = 120 } = {}) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(null)
  const isDragging = useRef(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setTimeout(() => {
        setRefreshing(false)
        setPullDistance(0)
      }, 600)
    }
  }, [onRefresh])

  useEffect(() => {
    function onTouchStart(e) {
      if (document.documentElement.scrollTop === 0) {
        startY.current = e.touches[0].clientY
        isDragging.current = true
      }
    }

    function onTouchMove(e) {
      if (!isDragging.current || startY.current === null) return
      const dist = e.touches[0].clientY - startY.current
      if (dist > 0 && document.documentElement.scrollTop === 0) {
        if (dist > 30) e.preventDefault()
        // Apply resistance so it feels elastic
        const resistance = 0.45
        setPullDistance(Math.min(dist * resistance, threshold * 1.5))
      }
    }

    function onTouchEnd() {
      if (!isDragging.current) return
      isDragging.current = false
      startY.current = null
      if (!refreshing) {
        setPullDistance(prev => {
          if (prev >= threshold) {
            handleRefresh()
            return threshold // hold at threshold while refreshing
          }
          return 0 // snap back
        })
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [refreshing, threshold, handleRefresh])

  return { pullDistance, refreshing }
}
