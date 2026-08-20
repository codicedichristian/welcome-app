import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import OnboardingSheet from './components/OnboardingSheet.jsx'
import PhoneReminderSheet from './components/PhoneReminderSheet.jsx'
import { UserContext } from './lib/UserContext.js'
import { getCurrentUserWithRole } from './lib/auth.js'
import SplashScreen from './components/SplashScreen.jsx'
import PWAInstallPrompt, { shouldShowPWAPrompt } from './components/PWAInstallPrompt.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import RedirectIfAuthenticated from './components/RedirectIfAuthenticated.jsx'
import LoginPage from './pages/LoginPage.jsx'
import WelcomeFlowPage from './pages/WelcomeFlowPage.jsx'
import HomePage from './pages/HomePage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import NewsPage from './pages/NewsPage.jsx'
import NewsDetailPage from './pages/NewsDetailPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import EditInfoPage from './pages/EditInfoPage.jsx'
import MyEventsPage from './pages/MyEventsPage.jsx'
import LastSundayPage from './pages/LastSundayPage.jsx'
import MidweekDetailPage from './pages/MidweekDetailPage.jsx'
import PastorsPage from './pages/PastorsPage.jsx'
import VisionPage from './pages/VisionPage.jsx'
import TeamsPage from './pages/TeamsPage.jsx'
import SeasonsPage from './pages/SeasonsPage.jsx'
import MidweeksDescriptionPage from './pages/MidweeksDescriptionPage.jsx'
import SeasonDetailPage from './pages/SeasonDetailPage.jsx'
import { getStoredUser } from './lib/user.js'
import { subscribeToPush } from './lib/push.js'
import { saveSubscription } from './lib/api.js'
import { supabase } from './lib/supabase.js'
import { ScrollToTop } from './components/ScrollToTop.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminMembers from './pages/admin/AdminMembers.jsx'
import AdminSchedules from './pages/admin/AdminSchedules.jsx'
import AdminScheduleDetail from './pages/admin/AdminScheduleDetail.jsx'
import AdminSundays from './pages/admin/AdminSundays.jsx'
import AdminSundayDetail from './pages/admin/AdminSundayDetail.jsx'
import AdminNews from './pages/admin/AdminNews.jsx'
import AdminEvents from './pages/admin/AdminEvents.jsx'
import AdminMidweek from './pages/admin/AdminMidweek.jsx'
import AdminMessages from './pages/admin/AdminMessages.jsx'
import AdminSeasons from './pages/admin/AdminSeasons.jsx'
import AdminExplore from './pages/admin/AdminExplore.jsx'
import AdminTeams from './pages/admin/AdminTeams.jsx'
import AdminAttendancePage from './pages/admin/AdminAttendancePage.jsx'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx'

const MidweekPage = lazy(() => import('./pages/MidweekPage.jsx'))

export default function App() {
  const location = useLocation()
  const isPublicRoute = location.pathname === '/welcome' || location.pathname === '/login'
  const [showSplash, setShowSplash] = useState(!isPublicRoute)
  const [splashVisible, setSplashVisible] = useState(!isPublicRoute)
  const [showPWAPrompt, setShowPWAPrompt] = useState(shouldShowPWAPrompt)
  const [showOnboardingSheet, setShowOnboardingSheet] = useState(false)
  const [showPhoneSheet, setShowPhoneSheet] = useState(false)
  const [user, setUser] = useState(() => getStoredUser())

  useEffect(() => {
    if (location.state?.showOnboarding) setShowOnboardingSheet(true)
    if (location.state?.showPhoneReminder) setShowPhoneSheet(true)
  }, [location.state])

  // Always refresh role from Supabase on mount — localStorage is cache only.
  useEffect(() => {
    getCurrentUserWithRole().then((freshUser) => {
      if (freshUser) setUser(freshUser)
    })
  }, [])

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
    <UserContext.Provider value={user}>
    <>
      {showSplash && <SplashScreen visible={splashVisible} />}
      {showPWAPrompt && <PWAInstallPrompt onDismiss={() => setShowPWAPrompt(false)} />}
      {showOnboardingSheet && <OnboardingSheet onComplete={() => setShowOnboardingSheet(false)} />}
      {showPhoneSheet && <PhoneReminderSheet onComplete={() => setShowPhoneSheet(false)} />}
      <ScrollToTop />
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/welcome" element={<WelcomeFlowPage />} />
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
            <Route path="last-sunday" element={<LastSundayPage />} />
            <Route path="midweek/:groupId" element={<MidweekDetailPage />} />
            <Route path="pastors" element={<PastorsPage />} />
            <Route path="vision" element={<VisionPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="seasons" element={<SeasonsPage />} />
            <Route path="seasons/:id" element={<SeasonDetailPage />} />
            <Route path="midweeks" element={<MidweeksDescriptionPage />} />
          </Route>
        </Route>
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/members" element={<AdminMembers />} />
            <Route path="admin/schedules" element={<AdminSchedules />} />
            <Route path="admin/schedules/:id" element={<AdminScheduleDetail />} />
            <Route path="admin/sundays" element={<AdminSundays />} />
            <Route path="admin/sundays/:scheduleId" element={<AdminSundayDetail />} />
            <Route path="admin/news" element={<AdminNews />} />
            <Route path="admin/events" element={<AdminEvents />} />
            <Route path="admin/midweek" element={<AdminMidweek />} />
            <Route path="admin/messages" element={<AdminMessages />} />
            <Route path="admin/seasons" element={<AdminSeasons />} />
            <Route path="admin/explore" element={<AdminExplore />} />
            <Route path="admin/teams" element={<AdminTeams />} />
            <Route path="admin/attendance" element={<AdminAttendancePage />} />
          </Route>
        </Route>
      </Routes>
    </>
    </UserContext.Provider>
  )
}
