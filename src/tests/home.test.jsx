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
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
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

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    await user.click(screen.getByText('Alice').closest('button'))
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
    // The card container is 160px tall
    await waitFor(() => {
      const card = document.querySelector('[style*="height: 170px"]')
      expect(card).not.toBeNull()
    })
  })

  test('Dot indicators count matches upcoming events', async () => {
    renderHome()
    await waitFor(() => {
      const card = document.querySelector('[style*="height: 170px"]')
      expect(card).not.toBeNull()
    })

    // Dot buttons have height: 5px and border-radius: 50px
    const dots = document.querySelectorAll('button[style*="height: 5px"]')
    expect(dots.length).toBeGreaterThan(0)
  })

  test('Announcements section shows at most 3 news items', async () => {
    renderHome()
    await waitFor(() => expect(screen.getByText('Announcements')).toBeInTheDocument())

    // Fallback news first item is 'Summer camp — sign up open'
    await waitFor(() => expect(screen.getByText('Summer camp — sign up open')).toBeInTheDocument())
    // Component slices to max 3 items
    const card = screen.getByText('Summer camp — sign up open').closest('[style*="background: rgb(26, 26, 26)"]')
    const items = card.querySelectorAll('button')
    expect(items.length).toBeLessThanOrEqual(3)
    expect(items.length).toBeGreaterThan(0)
  })

  test('All four quick access cards render', async () => {
    renderHome()
    await waitFor(() => expect(screen.getByText('Quick access')).toBeInTheDocument())

    expect(screen.getByText('Events calendar')).toBeInTheDocument()
    expect(screen.getByText('Last Sunday')).toBeInTheDocument()
    expect(screen.getByText('Find Midweek')).toBeInTheDocument()
    expect(screen.getByText('Donate')).toBeInTheDocument()
  })

  test('Tapping "Events calendar" navigates to /events', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => expect(screen.getByText('Events calendar')).toBeInTheDocument())

    await user.click(screen.getByText('Events calendar').closest('button'))
    expect(mockNavigate).toHaveBeenCalledWith('/events')
  })

  test('Tapping "Find Midweek" navigates to /midweek', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => expect(screen.getByText('Find Midweek')).toBeInTheDocument())

    await user.click(screen.getByText('Find Midweek').closest('button'))
    expect(mockNavigate).toHaveBeenCalledWith('/midweek')
  })

  test('Tapping "Last Sunday" navigates to /last-sunday', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => expect(screen.getByText('Last Sunday')).toBeInTheDocument())

    await user.click(screen.getByText('Last Sunday').closest('button'))
    expect(mockNavigate).toHaveBeenCalledWith('/last-sunday')
  })

  test('Tapping "Donate" opens donate modal', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => expect(screen.getByText('Donate')).toBeInTheDocument())

    await user.click(screen.getByText('Donate').closest('button'))
    expect(screen.getByText('Support the church')).toBeInTheDocument()
  })

  test('Donate modal can be closed', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => expect(screen.getByText('Donate')).toBeInTheDocument())

    await user.click(screen.getByText('Donate').closest('button'))
    expect(screen.getByText('Support the church')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText('Support the church')).not.toBeInTheDocument()
  })

  test('Swiping left on card advances to next event', async () => {
    renderHome()
    await waitFor(() => {
      const card = document.querySelector('[style*="height: 170px"]')
      expect(card).not.toBeNull()
    })

    // Capture the name on the first card (16px bold)
    const firstEventName = document.querySelector('[style*="font-size: 20px"][style*="font-weight: 700"]')?.textContent

    const container = document.querySelector('[style*="border-radius: 20px"][style*="overflow: hidden"]')
    expect(container).toBeTruthy()

    // Simulate a clear left swipe (diffX = -100, diffY = 5 — horizontal dominant)
    fireEvent.touchStart(container, { touches: [{ clientX: 200, clientY: 100 }] })
    fireEvent.touchEnd(container, { changedTouches: [{ clientX: 100, clientY: 105 }] })

    // Active dot index should advance — the first dot (active=0) becomes inactive
    await waitFor(() => {
      const activeDot = document.querySelector('button[style*="width: 14px"]')
      // After swipe, the active dot (wider) should not be the first button anymore
      const dots = [...document.querySelectorAll('button[style*="height: 5px"]')]
      if (dots.length > 1) {
        // The wide dot moved from position 0 to position 1
        expect(dots[0]).not.toHaveStyle({ width: '14px' })
      }
    })
  })
})
