import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import SplashScreen from './components/SplashScreen.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import RequireOnboarding from './components/RequireOnboarding.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import HomePage from './pages/HomePage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import NewsPage from './pages/NewsPage.jsx'
import NewsDetailPage from './pages/NewsDetailPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import EditInfoPage from './pages/EditInfoPage.jsx'
import MyEventsPage from './pages/MyEventsPage.jsx'

const MidweekPage = lazy(() => import('./pages/MidweekPage.jsx'))

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [splashVisible, setSplashVisible] = useState(true)

  useEffect(() => {
    const hideTimer = setTimeout(() => setSplashVisible(false), 1500)
    const removeTimer = setTimeout(() => setShowSplash(false), 2000)
    return () => {
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  return (
    <>
      {showSplash && <SplashScreen visible={splashVisible} />}
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<RequireOnboarding />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:eventId" element={<EventDetailPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="news/:id" element={<NewsDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="edit-info" element={<EditInfoPage />} />
            <Route
              path="midweek"
              element={
                <Suspense fallback={null}>
                  <MidweekPage />
                </Suspense>
              }
            />
            <Route path="my-events" element={<MyEventsPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
