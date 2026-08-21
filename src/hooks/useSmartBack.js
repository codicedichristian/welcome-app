import { useNavigate } from 'react-router-dom'

export function useSmartBack(fallback = '/') {
  const navigate = useNavigate()
  return () => {
    if (window.history.length > 1) {
      localStorage.setItem('returning_to_home', 'true')
      window.history.back()
    } else {
      navigate(fallback, { replace: true })
    }
  }
}
