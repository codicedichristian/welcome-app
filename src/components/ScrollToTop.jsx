import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if (navType === 'PUSH' || navType === 'REPLACE') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname, navType])

  return null
}
