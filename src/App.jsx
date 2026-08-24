import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import OnboardingSheet from './components/OnboardingSheet.jsx'
import { UserContext, UserSetterContext } from './lib/UserContext.js'
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
import { normalizeInterests } from './utils/normalizeInterests.js'
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
import PrayerRequestsPage from './pages/PrayerRequestsPage.jsx'

const MidweekPage = lazy(() => import('./pages/MidweekPage.jsx'))

export default function App() {
  const location = useLocation()
  const isPublicRoute = location.pathname === '/welcome' || location.pathname === '/login'
  const [showSplash, setShowSplash] = useState(!isPublicRoute)
  const [splashVisible, setSplashVisible] = useState(!isPublicRoute)
  const [showPWAPrompt, setShowPWAPrompt] = useState(shouldShowPWAPrompt)
  const [showOnboardingSheet, setShowOnboardingSheet] = useState(false)
  const [onboardingMissing, setOnboardingMissing] = useState(['interests', 'phone'])
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const stored = getStoredUser()
        setUser(stored?.id ? stored : session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const stored = getStoredUser()
        setUser(stored?.id ? stored : session.user)
      } else {
        setUser(null)
        localStorage.removeItem('welcome_user')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Triggered by LoginPage navigation state when onboarding_completed is false
  useEffect(() => {
    if (!location.state?.showOnboarding) return
    if (localStorage.getItem('onboarding_checked') === 'true') return
    setOnboardingMissing(['interests', 'age_range', 'phone', 'notifications'])
    setShowOnboardingSheet(true)
  }, [location.state])

  const userId = user?.id

  // Runs once at app mount — userId captured from getStoredUser() at render time.
  useEffect(() => {
    if (!userId) return
    getCurrentUserWithRole().then((freshUser) => {
      if (!freshUser) return

      // Guard: flag lives in localStorage so it survives iOS PWA navigation clears
      if (localStorage.getItem('onboarding_checked') === 'true') return

      // Hard guard: DB is the source of truth — if complete, lock and never show again
      if (freshUser.onboardingCompleted === true) {
        setShowOnboardingSheet(false)
        localStorage.setItem('onboarding_checked', 'true')
        return
      }

      setUser(freshUser)

      // Increment count once per browser session (sessionStorage clears on tab/browser close)
      let count = parseInt(localStorage.getItem('app_open_count') || '0', 10)
      if (!sessionStorage.getItem('session_started')) {
        count = count + 1
        localStorage.setItem('app_open_count', String(count))
        sessionStorage.setItem('session_started', 'true')
        console.log('[Onboarding] new session, count now:', count)
      } else {
        console.log('[Onboarding] same session, count unchanged:', count)
      }

      const sectionsToShow = []
      if (normalizeInterests(freshUser.interests).length === 0) sectionsToShow.push('interests')
      if (!freshUser.ageRange) sectionsToShow.push('age_range')
      if (!freshUser.phone || freshUser.phone === 'pending') sectionsToShow.push('phone')
      if (!freshUser.notifEmail && !freshUser.notifWhatsapp && !freshUser.notifApp) sectionsToShow.push('notifications')

      console.log('[Onboarding Check]', {
        onboarding_completed: freshUser.onboardingCompleted,
        interests: freshUser.interests,
        ageRange: freshUser.ageRange,
        phone: freshUser.phone,
        notifEmail: freshUser.notifEmail,
        notifWhatsapp: freshUser.notifWhatsapp,
        notifApp: freshUser.notifApp,
        app_open_count: count,
        sectionsToShow,
      })

      // Case A: onboarding never completed — always show all sections
      if (freshUser.onboardingCompleted !== true) {
        setOnboardingMissing(['interests', 'age_range', 'phone', 'notifications'])
        setShowOnboardingSheet(true)
      // Case B: every 5th open, only if something is still missing
      } else if (count > 0 && count % 5 === 0 && sectionsToShow.length > 0) {
        setOnboardingMissing(sectionsToShow)
        setShowOnboardingSheet(true)
      // Case C: all complete
      } else {
        setShowOnboardingSheet(false)
      }

      // Mark as checked — localStorage persists across sessions on iOS PWA
      localStorage.setItem('onboarding_checked', 'true')
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
    if (!user.id || !user.notifApp) return
    if (Notification.permission !== 'default') return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return

      subscribeToPush().then((subscription) => {
        if (!subscription) return
        saveSubscription(user.id, subscription).then((result) => console.log('Save result:', result))
      })
    })
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #2a2a2a', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <UserContext.Provider value={user}>
    <UserSetterContext.Provider value={setUser}>
    <>
      {showSplash && <SplashScreen visible={splashVisible} />}
      {showPWAPrompt && <PWAInstallPrompt onDismiss={() => setShowPWAPrompt(false)} />}
      {showOnboardingSheet && (
        <OnboardingSheet
          sectionsToShow={onboardingMissing}
          onComplete={() => setShowOnboardingSheet(false)}
          onSave={(updates) => setUser((prev) => ({ ...prev, ...updates }))}
        />
      )}
      <ScrollToTop />
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/" element={user ? <Navigate to="/home" replace /> : <WelcomeFlowPage />} />
        <Route path="/welcome" element={user ? <Navigate to="/home" replace /> : <WelcomeFlowPage />} />
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="home" element={<HomePage />} />
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
            <Route path="prayer-requests" element={<PrayerRequestsPage />} />
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
        <Route path="*" element={user ? <Navigate to="/home" replace /> : <Navigate to="/welcome" replace />} />
      </Routes>
    </>
    </UserSetterContext.Provider>
    </UserContext.Provider>
  )
}
