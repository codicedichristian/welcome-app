import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { user: { id: 'auth-user-1' } } }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}))

vi.mock('../lib/api.js', () => ({
  getEvents: vi.fn(async () => ({ data: [], error: null })),
  getNews: vi.fn(async () => ({ data: [], error: null })),
  saveSubscription: vi.fn(async () => ({ data: null, error: null })),
  getUserByAuthId: vi.fn(async () => ({ data: null, error: null })),
}))

vi.mock('../lib/push.js', () => ({
  subscribeToPush: vi.fn(async () => null),
  unsubscribeFromPush: vi.fn(async () => {}),
}))

import FloatingNav from '../components/FloatingNav.jsx'
import AppLayout from '../layouts/AppLayout.jsx'

const MEMBER_USER = { id: 'usr-1', firstName: 'Alice', lastName: 'Smith', role: 'member' }

function renderFloatingNav(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <FloatingNav />
    </MemoryRouter>,
  )
}

// Renders AppLayout at a given path with stub child pages
function renderLayout(initialPath = '/') {
  localStorage.setItem('welcome_user', JSON.stringify(MEMBER_USER))
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>Home Page</div>} />
          <Route path="events" element={<div>Events Page</div>} />
          <Route path="events/:id" element={<div>Event Detail Page</div>} />
          <Route path="news" element={<div>News Page</div>} />
          <Route path="news/:id" element={<div>News Detail Page</div>} />
          <Route path="profile" element={<div>Profile Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('FloatingNav', () => {
  test('Renders Home, Events, and News tab buttons', () => {
    renderFloatingNav('/')
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /events/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /news/i })).toBeInTheDocument()
  })

  test('Home tab is visually active when at /', () => {
    renderFloatingNav('/')
    const homeBtn = screen.getByRole('button', { name: /home/i })
    // Active tab gets background #2e2e2e
    expect(homeBtn).toHaveStyle({ background: '#2e2e2e' })
  })

  test('Events tab is visually active when at /events', () => {
    renderFloatingNav('/events')
    const eventsBtn = screen.getByRole('button', { name: /events/i })
    expect(eventsBtn).toHaveStyle({ background: '#2e2e2e' })
  })

  test('News tab is visually active when at /news', () => {
    renderFloatingNav('/news')
    const newsBtn = screen.getByRole('button', { name: /news/i })
    expect(newsBtn).toHaveStyle({ background: '#2e2e2e' })
  })

  test('Tapping Home tab navigates to /', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/events']}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/events" element={<FloatingNav />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /home/i }))
    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })

  test('Tapping Events tab navigates to /events', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<FloatingNav />} />
          <Route path="/events" element={<div>Events Page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /events/i }))
    expect(screen.getByText('Events Page')).toBeInTheDocument()
  })

  test('Tapping News tab navigates to /news', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<FloatingNav />} />
          <Route path="/news" element={<div>News Page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /news/i }))
    expect(screen.getByText('News Page')).toBeInTheDocument()
  })
})

describe('AppLayout FloatingNav visibility', () => {
  test('FloatingNav is visible on /', () => {
    renderLayout('/')
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
  })

  test('FloatingNav is visible on /events', () => {
    renderLayout('/events')
    expect(screen.getByRole('button', { name: /events/i })).toBeInTheDocument()
  })

  test('FloatingNav is visible on /news', () => {
    renderLayout('/news')
    expect(screen.getByRole('button', { name: /news/i })).toBeInTheDocument()
  })

  test('FloatingNav is hidden on event detail page (/events/:id)', () => {
    renderLayout('/events/evt-1')
    // FloatingNav only renders when showNav is true (MAIN_ROUTES)
    // On /events/evt-1 it should NOT be in the document
    expect(screen.queryByRole('button', { name: /home/i })).not.toBeInTheDocument()
  })

  test('FloatingNav is hidden on news detail page (/news/:id)', () => {
    renderLayout('/news/news-1')
    expect(screen.queryByRole('button', { name: /home/i })).not.toBeInTheDocument()
  })

  test('FloatingNav is hidden on profile page (/profile)', () => {
    renderLayout('/profile')
    expect(screen.queryByRole('button', { name: /home/i })).not.toBeInTheDocument()
  })
})
