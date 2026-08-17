import { useNavigate } from 'react-router-dom'

export function useSmartBack(fallback = '/') {
  const navigate = useNavigate()
  return () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigate(fallback, { replace: true })
    }
  }
}
