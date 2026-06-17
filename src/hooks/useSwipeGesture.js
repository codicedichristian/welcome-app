import { useEffect } from 'react'

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 50 }) {
  useEffect(() => {
    let startX = 0
    let startY = 0

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchEnd = (e) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const diffX = endX - startX
      const diffY = endY - startY

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(diffX) < Math.abs(diffY)) return
      if (Math.abs(diffX) < threshold) return

      // Only trigger from edges
      if (diffX > 0 && startX < 30) onSwipeRight?.()
      if (diffX < 0 && startX > window.innerWidth - 30) onSwipeLeft?.()
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, threshold])
}
