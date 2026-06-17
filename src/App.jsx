import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import SplashScreen from './components/SplashScreen.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import RedirectIfAuthenticated from './components/RedirectIfAuthenticated.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import NewsPage from './pages/NewsPage.jsx'
import NewsDetailPage from './pages/NewsDetailPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import EditInfoPage from './pages/EditInfoPage.jsx'
import MyEventsPage from './pages/MyEventsPage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminEvents from './pages/admin/AdminEvents.jsx'
import AdminNews from './pages/admin/AdminNews.jsx'
import AdminMidweek from './pages/admin/AdminMidweek.jsx'
import AdminMembers from './pages/admin/AdminMembers.jsx'
import { getStoredUser } from './lib/user.js'
import { subscribeToPush } from './lib/push.js'
import { saveSubscription } from './lib/api.js'
import { supabase } from './lib/supabase.js'

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

  useEffect(() => {
    const user = getStoredUser()
    if (!user.id || !user.notifications?.app) return
    if (Notification.permission !== 'default') return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return

      subscribeToPush().then((subscription) => {
        if (!subscription) return
        saveSubscription(user.id, subscription).then((result) => console.log('Save result:', result))
      })
    })
  }, [])

  return (
    <>
      {showSplash && <SplashScreen visible={splashVisible} />}
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<RequireAuth />}>
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

          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/events" element={<AdminEvents />} />
              <Route path="admin/news" element={<AdminNews />} />
              <Route path="admin/midweek" element={<AdminMidweek />} />
              <Route path="admin/members" element={<AdminMembers />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  )
}
