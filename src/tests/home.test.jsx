import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Stable mock navigate so tests can assert on it
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useOutletContext: () => ({ openRightPanel: mockOpenRightPanel }),
  }
})

const mockOpenRightPanel = vi.fn()

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}))

// Return empty so HomePage falls back to local fixture data
vi.mock('../lib/api.js', () => ({
  getEvents: vi.fn(async () => ({ data: [], error: null })),
  getNews: vi.fn(async () => ({ data: [], error: null })),
  getLatestSundaySummary: vi.fn(async () => ({ data: null, error: null })),
  saveSubscription: vi.fn(async () => ({ data: null, error: null })),
  getUserByAuthId: vi.fn(async () => ({ data: null, error: null })),
}))

vi.mock('../lib/push.js', () => ({
  subscribeToPush: vi.fn(async () => null),
  unsubscribeFromPush: vi.fn(async () => {}),
}))

import HomePage from '../pages/HomePage.jsx'

const MEMBER_USER = {
  id: 'usr-1',
  firstName: 'Alice',
  lastName: 'Johnson',
  email: 'alice@example.com',
  role: 'member',
}

function renderHome() {
  localStorage.setItem('welcome_user', JSON.stringify(MEMBER_USER))
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<div>Events Page</div>} />
        <Route path="/events/:id" element={<div>Event Detail</div>} />
        <Route path="/midweek" element={<div>Midweek Page</div>} />
        <Route path="/last-sunday" element={<div>Last Sunday Page</div>} />
        <Route path="/my-events" element={<div>My Events Page</div>} />
        <Route path="/news/:id" element={<div>News Detail</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockNavigate.mockReset()
  mockOpenRightPanel.mockReset()
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('HomePage', () => {
  test('Header shows user first name from localStorage', async () => {
    renderHome()
    // Name is displayed lowercase per design spec
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())
  })

  test('Header shows time-based greeting', async () => {
    renderHome()
    await waitFor(() => {
      const greetings = ['Good morning!', 'Good afternoon!', 'Good evening!']
      const found = greetings.some((g) => screen.queryByText(g))
      expect(found).toBe(true)
    })
  })

  test('Tapping greeting area calls openRightPanel', async () => {
    const user = userEvent.setup()
    renderHome()

    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())
    await user.click(screen.getByText('alice').closest('button'))
    expect(mockOpenRightPanel).toHaveBeenCalledTimes(1)
  })

  test('Tapping avatar calls openRightPanel', async () => {
    const user = userEvent.setup()
    renderHome()

    await waitFor(() => expect(screen.getByText('AJ')).toBeInTheDocument())
    await user.click(screen.getByText('AJ'))
    expect(mockOpenRightPanel).toHaveBeenCalledTimes(1)
  })

  test('Upcoming events section renders with at least one event card', async () => {
    renderHome()
    await waitFor(() => expect(screen.getByText('Upcoming events')).toBeInTheDocument())
    await waitFor(() => {
      // Event cards are 176px wide buttons
      const card = document.querySelector('button[style*="width: 176px"]')
      expect(card).not.toBeNull()
    })
  })

  test('Explore carousel shows 5 dot indicators', async () => {
    renderHome()
    await waitFor(() => expect(screen.getByText('Explore the Church')).toBeInTheDocument())
    // SwipeCarousel dots are buttons with height: 5px
    await waitFor(() => {
      const dots = document.querySelectorAll('button[style*="height: 5px"]')
      expect(dots.length).toBe(5)
    })
  })

  test('"See all" navigates to /events', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => expect(screen.getByText('See all')).toBeInTheDocument())
    await user.click(screen.getByText('See all'))
    expect(mockNavigate).toHaveBeenCalledWith('/events')
  })

  test('Announcements section shows up to 4 news tiles', async () => {
    renderHome()
    await waitFor(() => expect(screen.getByText('Announcements')).toBeInTheDocument())
    // Tiles are image-only buttons (no title text in the new design)
    await waitFor(() => {
      const section = screen.getByText('Announcements').closest('section')
      const items = section.querySelectorAll('button')
      expect(items.length).toBeGreaterThan(0)
      expect(items.length).toBeLessThanOrEqual(4)
    })
  })

  test('Tapping "My Events" navigates to /my-events', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())

    await user.click(screen.getByText('My Events').closest('button'))
    expect(mockNavigate).toHaveBeenCalledWith('/my-events')
  })

  test('Weekday strip renders 7 day buttons', async () => {
    renderHome()
    await waitFor(() => expect(screen.getByText('Upcoming events')).toBeInTheDocument())
    // 7 day tile buttons (42×42 divs inside buttons)
    const dayTiles = document.querySelectorAll('button[style*="flex-direction: column"][style*="min-width: 42px"]')
    expect(dayTiles.length).toBe(7)
  })
})
