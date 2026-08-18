import { useEffect, useRef, useState } from 'react'

export default function SwipeCarousel({ items, renderItem }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const containerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontalDrag = useRef(null)
  const velocityPoints = useRef([])
  const isDraggingRef = useRef(false)
  const cardWidthRef = useRef(0)
  const didDrag = useRef(false)
  const dragStartX = useRef(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (e) => {
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current
      if (isHorizontalDrag.current === null) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isHorizontalDrag.current = Math.abs(dx) > Math.abs(dy)
        return
      }
      if (!isHorizontalDrag.current) return
      e.preventDefault()
      setDragOffset(dx)
      velocityPoints.current.push({ x: e.touches[0].clientX, t: Date.now() })
      if (velocityPoints.current.length > 5) velocityPoints.current.shift()
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [items.length])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - dragStartX.current
      setDragOffset(dx)
      velocityPoints.current.push({ x: e.clientX, t: Date.now() })
      if (velocityPoints.current.length > 5) velocityPoints.current.shift()
    }
    const onMouseUp = (e) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      const dx = e.clientX - dragStartX.current
      didDrag.current = Math.abs(dx) >= 10
      const velocity = calcVelocity()
      let newIndex = activeIndex
      if ((dx < -50 || velocity < -0.3) && activeIndex < items.length - 1) newIndex = activeIndex + 1
      else if ((dx > 50 || velocity > 0.3) && activeIndex > 0) newIndex = activeIndex - 1
      setActiveIndex(newIndex)
      setIsDragging(false)
      setDragOffset(0)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [activeIndex, items.length])

  function calcVelocity() {
    const track = velocityPoints.current
    if (track.length < 2) return 0
    const last = track[track.length - 1]
    const first = track[0]
    const dt = last.t - first.t
    return dt > 0 ? (last.x - first.x) / dt : 0
  }

  const handleTouchStart = (e) => {
    cardWidthRef.current = containerRef.current?.offsetWidth ?? 0
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontalDrag.current = null
    velocityPoints.current = [{ x: e.touches[0].clientX, t: Date.now() }]
    isDraggingRef.current = true
    didDrag.current = false
    setIsDragging(true)
  }

  const handleTouchEnd = (e) => {
    isDraggingRef.current = false
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const dx = endX - touchStartX.current
    const dy = endY - touchStartY.current
    const horizontal = isHorizontalDrag.current ?? (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5)
    if (!horizontal) { setIsDragging(false); setDragOffset(0); return }
    didDrag.current = Math.abs(dx) >= 10
    const velocity = calcVelocity()
    let newIndex = activeIndex
    if ((dx < -50 || velocity < -0.3) && activeIndex < items.length - 1) newIndex = activeIndex + 1
    else if ((dx > 50 || velocity > 0.3) && activeIndex > 0) newIndex = activeIndex - 1
    setActiveIndex(newIndex)
    setIsDragging(false)
    setDragOffset(0)
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    dragStartX.current = e.clientX
    isDraggingRef.current = true
    didDrag.current = false
    velocityPoints.current = [{ x: e.clientX, t: Date.now() }]
    setIsDragging(true)
  }

  const cw = cardWidthRef.current || 1
  let activeDotIndex = activeIndex
  if (isDragging) {
    if (dragOffset < -(cw * 0.5) && activeIndex < items.length - 1) activeDotIndex = activeIndex + 1
    else if (dragOffset > (cw * 0.5) && activeIndex > 0) activeDotIndex = activeIndex - 1
  }

  return (
    <>
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          overflow: 'hidden',
          margin: '0 -22px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            transform: `translateX(calc(${-activeIndex * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 280ms ease-out',
            willChange: 'transform',
          }}
        >
          {items.map((item, i) => (
            <div key={i} style={{ flex: '0 0 100%', width: '100%', minWidth: '100%', padding: '0 22px' }}>
              {renderItem(item, didDrag)}
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '7px', marginTop: '14px' }}>
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setActiveIndex(i); setDragOffset(0) }}
              style={{
                height: '6px',
                width: i === activeDotIndex ? '20px' : '6px',
                borderRadius: i === activeDotIndex ? '3px' : '50%',
                background: i === activeDotIndex ? '#ffffff' : '#4a4a47',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
