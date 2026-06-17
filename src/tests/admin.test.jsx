import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import { mockSupabase, mockState, resetMockSupabase } from './mocks/supabase.js'
import { buildInitialData } from './fixtures/adminData.js'

vi.mock('../lib/supabase.js', () => ({ supabase: mockSupabase }))

import AdminEvents from '../pages/admin/AdminEvents.jsx'
import AdminNews from '../pages/admin/AdminNews.jsx'
import AdminMidweek from '../pages/admin/AdminMidweek.jsx'
import AdminMembers from '../pages/admin/AdminMembers.jsx'
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import AdminRoute from '../components/AdminRoute.jsx'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

beforeEach(() => {
  resetMockSupabase(buildInitialData())
})

afterEach(() => {
  localStorage.clear()
})

// --- EVENTS ---
describe('Admin Events', () => {
  test('fetches and displays all events', async () => {
    renderWithRouter(<AdminEvents />)

    expect(await screen.findByText('Sunday Service')).toBeInTheDocument()
    expect(screen.getByText('Youth Night')).toBeInTheDocument()
    // 'Midweek' appears in both the title column and the type column (capitalize('midweek') = 'Midweek')
    expect(screen.getAllByText('Midweek')).toHaveLength(2)
  })

  test('creates a new event with all fields filled', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminEvents />)
    await screen.findByText('Sunday Service')

    await user.click(screen.getByRole('button', { name: /add event/i }))
    expect(await screen.findByRole('heading', { name: /add event/i })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/^title$/i), 'Prayer Meeting')
    await user.selectOptions(screen.getByLabelText(/^type$/i), 'prayer')
    await user.selectOptions(screen.getByLabelText(/^icon$/i), 'hands')
    await user.click(screen.getByLabelText('Purple'))
    await user.type(screen.getByLabelText(/description/i), 'A time of corporate prayer')
    await user.type(screen.getByLabelText(/location/i), 'Prayer Room')
    await user.type(screen.getByLabelText(/audience/i), 'Everyone')
    await user.selectOptions(screen.getByLabelText(/recurring/i), 'none')
    fireEvent.change(screen.getByLabelText(/event date/i), { target: { value: '2026-07-01' } })
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '18:00' } })
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '20:00' } })

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /add event/i })).not.toBeInTheDocument())

    expect(mockState.data.events).toHaveLength(4)
    const created = mockState.data.events.find((event) => event.title === 'Prayer Meeting')
    expect(created).toMatchObject({
      title: 'Prayer Meeting',
      type: 'prayer',
      icon: 'hands',
      color: '#a78bfa',
      description: 'A time of corporate prayer',
      location: 'Prayer Room',
      audience: 'Everyone',
      recurring: null,
      event_date: '2026-07-01',
      start_time: '18:00',
      end_time: '20:00',
    })
  })

  test('shows new event in the list after creation', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminEvents />)
    await screen.findByText('Sunday Service')

    await user.click(screen.getByRole('button', { name: /add event/i }))
    await user.type(screen.getByLabelText(/^title$/i), 'Prayer Meeting')
    fireEvent.change(screen.getByLabelText(/event date/i), { target: { value: '2026-07-01' } })
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('Prayer Meeting')).toBeInTheDocument()
  })

  test('edits an existing event and saves changes', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminEvents />)
    await screen.findByText('Sunday Service')

    const row = screen.getByText('Sunday Service').closest('tr')
    await user.click(within(row).getByRole('button', { name: /edit/i }))

    expect(await screen.findByRole('heading', { name: /edit event/i })).toBeInTheDocument()
    const titleInput = screen.getByLabelText(/^title$/i)
    expect(titleInput).toHaveValue('Sunday Service')

    await user.clear(titleInput)
    await user.type(titleInput, 'Sunday Worship Service')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /edit event/i })).not.toBeInTheDocument())

    const updated = mockState.data.events.find((event) => event.id === 'evt-1')
    expect(updated.title).toBe('Sunday Worship Service')
  })

  test('shows updated event title in the list', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminEvents />)
    await screen.findByText('Sunday Service')

    const row = screen.getByText('Sunday Service').closest('tr')
    await user.click(within(row).getByRole('button', { name: /edit/i }))
    await screen.findByRole('heading', { name: /edit event/i })

    const titleInput = screen.getByLabelText(/^title$/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Sunday Worship Service')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('Sunday Worship Service')).toBeInTheDocument()
    expect(screen.queryByText('Sunday Service')).not.toBeInTheDocument()
  })

  test('deletes an event after confirmation', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminEvents />)
    await screen.findByText('Youth Night')

    const row = screen.getByText('Youth Night').closest('tr')
    await user.click(within(row).getByRole('button', { name: /delete/i }))

    const heading = await screen.findByRole('heading', { name: /delete event/i })
    const dialog = heading.closest('div')
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /delete event/i })).not.toBeInTheDocument())

    expect(mockState.data.events.find((event) => event.id === 'evt-2')).toBeUndefined()
  })

  test('removed event no longer appears in list', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminEvents />)
    await screen.findByText('Youth Night')

    const row = screen.getByText('Youth Night').closest('tr')
    await user.click(within(row).getByRole('button', { name: /delete/i }))

    const heading = await screen.findByRole('heading', { name: /delete event/i })
    const dialog = heading.closest('div')
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(screen.queryByText('Youth Night')).not.toBeInTheDocument())
  })

  test('shows error if required fields are empty on create', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminEvents />)
    await screen.findByText('Sunday Service')

    await user.click(screen.getByRole('button', { name: /add event/i }))
    await screen.findByRole('heading', { name: /add event/i })

    const titleInput = screen.getByLabelText(/^title$/i)
    expect(titleInput).toBeRequired()
    expect(titleInput).toHaveValue('')

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(screen.getByRole('heading', { name: /add event/i })).toBeInTheDocument()
    expect(mockState.data.events).toHaveLength(3)
  })
})

// --- NEWS ---
describe('Admin News', () => {
  test('fetches and displays all news', async () => {
    renderWithRouter(<AdminNews />)

    expect(await screen.findByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Summer Camp Registration Open')).toBeInTheDocument()
    expect(screen.getByText('New Sermon Series')).toBeInTheDocument()
  })

  test('creates a new news item with title, body and category', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminNews />)
    await screen.findByText('Welcome Back')

    await user.click(screen.getByRole('button', { name: /add news/i }))
    expect(await screen.findByRole('heading', { name: /add news/i })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/^title$/i), 'Baptism Sunday')
    await user.type(screen.getByLabelText(/^body$/i), 'Join us as several members get baptized this Sunday.')
    await user.selectOptions(screen.getByLabelText(/category/i), 'Event')
    await user.click(screen.getByLabelText('Green'))
    fireEvent.change(screen.getByLabelText(/published date/i), { target: { value: '2026-06-15' } })

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /add news/i })).not.toBeInTheDocument())

    expect(mockState.data.news).toHaveLength(4)
    const created = mockState.data.news.find((item) => item.title === 'Baptism Sunday')
    expect(created).toMatchObject({
      title: 'Baptism Sunday',
      body: 'Join us as several members get baptized this Sunday.',
      category: 'Event',
      color: '#4caf7d',
      published_at: '2026-06-15',
    })
  })

  test('shows new news in the list after creation', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminNews />)
    await screen.findByText('Welcome Back')

    await user.click(screen.getByRole('button', { name: /add news/i }))
    await user.type(screen.getByLabelText(/^title$/i), 'Baptism Sunday')
    await user.type(screen.getByLabelText(/^body$/i), 'Join us this Sunday.')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('Baptism Sunday')).toBeInTheDocument()
  })

  test('edits an existing news item', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminNews />)
    await screen.findByText('Welcome Back')

    const row = screen.getByText('Welcome Back').closest('tr')
    await user.click(within(row).getByRole('button', { name: /edit/i }))

    expect(await screen.findByRole('heading', { name: /edit news/i })).toBeInTheDocument()
    const titleInput = screen.getByLabelText(/^title$/i)
    expect(titleInput).toHaveValue('Welcome Back')

    await user.clear(titleInput)
    await user.type(titleInput, 'Welcome Back, Church Family')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /edit news/i })).not.toBeInTheDocument())

    const updated = mockState.data.news.find((item) => item.id === 'news-1')
    expect(updated.title).toBe('Welcome Back, Church Family')
  })

  test('shows updated title in list after edit', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminNews />)
    await screen.findByText('Welcome Back')

    const row = screen.getByText('Welcome Back').closest('tr')
    await user.click(within(row).getByRole('button', { name: /edit/i }))
    await screen.findByRole('heading', { name: /edit news/i })

    const titleInput = screen.getByLabelText(/^title$/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Welcome Back, Church Family')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('Welcome Back, Church Family')).toBeInTheDocument()
    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument()
  })

  test('deletes a news item after confirmation', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminNews />)
    await screen.findByText('Summer Camp Registration Open')

    const row = screen.getByText('Summer Camp Registration Open').closest('tr')
    await user.click(within(row).getByRole('button', { name: /delete/i }))

    const heading = await screen.findByRole('heading', { name: /delete news/i })
    const dialog = heading.closest('div')
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /delete news/i })).not.toBeInTheDocument())

    expect(mockState.data.news.find((item) => item.id === 'news-2')).toBeUndefined()
  })

  test('removed news no longer appears in list', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminNews />)
    await screen.findByText('Summer Camp Registration Open')

    const row = screen.getByText('Summer Camp Registration Open').closest('tr')
    await user.click(within(row).getByRole('button', { name: /delete/i }))

    const heading = await screen.findByRole('heading', { name: /delete news/i })
    const dialog = heading.closest('div')
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(screen.queryByText('Summer Camp Registration Open')).not.toBeInTheDocument())
  })

  test('shows error if title or body is empty', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminNews />)
    await screen.findByText('Welcome Back')

    await user.click(screen.getByRole('button', { name: /add news/i }))
    await screen.findByRole('heading', { name: /add news/i })

    const titleInput = screen.getByLabelText(/^title$/i)
    const bodyInput = screen.getByLabelText(/^body$/i)
    expect(titleInput).toBeRequired()
    expect(bodyInput).toBeRequired()
    expect(titleInput).toHaveValue('')
    expect(bodyInput).toHaveValue('')

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(screen.getByRole('heading', { name: /add news/i })).toBeInTheDocument()
    expect(mockState.data.news).toHaveLength(3)
  })
})

// --- MIDWEEK GROUPS ---
describe('Admin Midweek Groups', () => {
  test('fetches and displays all midweek groups', async () => {
    renderWithRouter(<AdminMidweek />)

    expect(await screen.findByText('Maria Lopez')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('Ana Garcia')).toBeInTheDocument()
  })

  test('creates a new group with host, zone, address, phone, lat, lng', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMidweek />)
    await screen.findByText('Maria Lopez')

    await user.click(screen.getByRole('button', { name: /add group/i }))
    expect(await screen.findByRole('heading', { name: /add group/i })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/host name/i), 'Laura Fernandez')
    await user.type(screen.getByLabelText(/zone/i), 'Retiro')
    await user.type(screen.getByLabelText(/address/i), 'Calle Alcala 50')
    await user.type(screen.getByLabelText(/phone/i), '34600000099')
    fireEvent.change(screen.getByLabelText(/latitude/i), { target: { value: '40.41' } })
    fireEvent.change(screen.getByLabelText(/longitude/i), { target: { value: '-3.68' } })

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /add group/i })).not.toBeInTheDocument())

    expect(mockState.data.midweek_groups).toHaveLength(4)
    const created = mockState.data.midweek_groups.find((group) => group.host === 'Laura Fernandez')
    expect(created).toMatchObject({
      host: 'Laura Fernandez',
      zone: 'Retiro',
      address: 'Calle Alcala 50',
      phone: '34600000099',
      lat: 40.41,
      lng: -3.68,
    })
  })

  test('auto-generates initials from host name', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMidweek />)
    await screen.findByText('Maria Lopez')

    await user.click(screen.getByRole('button', { name: /add group/i }))
    await screen.findByRole('heading', { name: /add group/i })

    await user.type(screen.getByLabelText(/host name/i), 'Laura Fernandez')

    expect(screen.getByLabelText(/initials/i)).toHaveValue('LF')
  })

  test('shows new group in list after creation', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMidweek />)
    await screen.findByText('Maria Lopez')

    await user.click(screen.getByRole('button', { name: /add group/i }))
    await user.type(screen.getByLabelText(/host name/i), 'Laura Fernandez')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('Laura Fernandez')).toBeInTheDocument()
  })

  test('edits an existing group', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMidweek />)
    await screen.findByText('Maria Lopez')

    const row = screen.getByText('Maria Lopez').closest('tr')
    await user.click(within(row).getByRole('button', { name: /edit/i }))

    expect(await screen.findByRole('heading', { name: /edit group/i })).toBeInTheDocument()
    const hostInput = screen.getByLabelText(/host name/i)
    expect(hostInput).toHaveValue('Maria Lopez')

    await user.clear(hostInput)
    await user.type(hostInput, 'Maria Lopez-Garcia')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /edit group/i })).not.toBeInTheDocument())

    const updated = mockState.data.midweek_groups.find((group) => group.id === 'grp-1')
    expect(updated.host).toBe('Maria Lopez-Garcia')
  })

  test('shows updated host name in list after edit', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMidweek />)
    await screen.findByText('Maria Lopez')

    const row = screen.getByText('Maria Lopez').closest('tr')
    await user.click(within(row).getByRole('button', { name: /edit/i }))
    await screen.findByRole('heading', { name: /edit group/i })

    const hostInput = screen.getByLabelText(/host name/i)
    await user.clear(hostInput)
    await user.type(hostInput, 'Maria Lopez-Garcia')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('Maria Lopez-Garcia')).toBeInTheDocument()
    expect(screen.queryByText('Maria Lopez')).not.toBeInTheDocument()
  })

  test('deletes a group after confirmation', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMidweek />)
    await screen.findByText('John Smith')

    const row = screen.getByText('John Smith').closest('tr')
    await user.click(within(row).getByRole('button', { name: /delete/i }))

    const heading = await screen.findByRole('heading', { name: /delete group/i })
    const dialog = heading.closest('div')
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: /delete group/i })).not.toBeInTheDocument())

    expect(mockState.data.midweek_groups.find((group) => group.id === 'grp-2')).toBeUndefined()
  })

  test('removed group no longer appears in list', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMidweek />)
    await screen.findByText('John Smith')

    const row = screen.getByText('John Smith').closest('tr')
    await user.click(within(row).getByRole('button', { name: /delete/i }))

    const heading = await screen.findByRole('heading', { name: /delete group/i })
    const dialog = heading.closest('div')
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(screen.queryByText('John Smith')).not.toBeInTheDocument())
  })

  test('toggles group active/inactive status', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMidweek />)
    await screen.findByText('Maria Lopez')

    const row = screen.getByText('Maria Lopez').closest('tr')
    expect(within(row).getByText('Active')).toBeInTheDocument()

    await user.click(within(row).getByRole('button', { name: /edit/i }))
    await screen.findByRole('heading', { name: /edit group/i })

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: /edit group/i })).not.toBeInTheDocument())

    const updatedRow = screen.getByText('Maria Lopez').closest('tr')
    expect(within(updatedRow).getByText('Inactive')).toBeInTheDocument()
  })
})

// --- MEMBERS ---
describe('Admin Members', () => {
  test('fetches and displays all members', async () => {
    renderWithRouter(<AdminMembers />)

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('Bob Williams')).toBeInTheDocument()
    expect(screen.getByText('Carla Diaz')).toBeInTheDocument()
    expect(screen.getByText('David Martin')).toBeInTheDocument()
    expect(screen.getByText('Elena Ruiz')).toBeInTheDocument()
  })

  test('shows member name, email, phone, age range', async () => {
    renderWithRouter(<AdminMembers />)
    await screen.findByText('Alice Johnson')

    const row = screen.getByText('Alice Johnson').closest('tr')
    expect(within(row).getByText('alice@example.com')).toBeInTheDocument()
    expect(within(row).getByText('34600000010')).toBeInTheDocument()
    expect(within(row).getByText('26-35')).toBeInTheDocument()
  })

  test('filters members by name using search bar', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMembers />)
    await screen.findByText('Alice Johnson')

    await user.type(screen.getByPlaceholderText(/search by name or email/i), 'Alice')

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.queryByText('Bob Williams')).not.toBeInTheDocument()
  })

  test('filters members by email using search bar', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMembers />)
    await screen.findByText('Alice Johnson')

    await user.type(screen.getByPlaceholderText(/search by name or email/i), 'bob@example.com')

    expect(screen.getByText('Bob Williams')).toBeInTheDocument()
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument()
  })

  test('exports members as CSV', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMembers />)
    await screen.findByText('Alice Johnson')

    const createObjectURL = vi.fn(() => 'blob:mock-url')
    const revokeObjectURL = vi.fn()
    global.URL.createObjectURL = createObjectURL
    global.URL.revokeObjectURL = revokeObjectURL
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await user.click(screen.getByRole('button', { name: /export csv/i }))

    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

    clickSpy.mockRestore()
  })

  test('shows empty state when no members found', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminMembers />)
    await screen.findByText('Alice Johnson')

    await user.type(screen.getByPlaceholderText(/search by name or email/i), 'nonexistent')

    expect(await screen.findByText(/no members found/i)).toBeInTheDocument()
  })
})

// --- DASHBOARD ---
describe('Admin Dashboard', () => {
  function getCardValue(label) {
    const labelEl = screen.getByText(label)
    return within(labelEl.closest('div'))
  }

  test('shows total members count', async () => {
    renderWithRouter(<AdminDashboard />)
    await screen.findByText('Total members')

    expect(getCardValue('Total members').getByText('5')).toBeInTheDocument()
  })

  test('shows upcoming events count', async () => {
    renderWithRouter(<AdminDashboard />)
    await screen.findByText('Upcoming events')

    expect(getCardValue('Upcoming events').getByText('3')).toBeInTheDocument()
  })

  test('shows total news count', async () => {
    renderWithRouter(<AdminDashboard />)
    await screen.findByText('Total news')

    expect(getCardValue('Total news').getByText('3')).toBeInTheDocument()
  })

  test('shows active midweek groups count', async () => {
    renderWithRouter(<AdminDashboard />)
    await screen.findByText('Active midweek groups')

    expect(getCardValue('Active midweek groups').getByText('2')).toBeInTheDocument()
  })

  test('shows recent registrations list', async () => {
    renderWithRouter(<AdminDashboard />)
    await screen.findByText('Recent activity')

    expect(await screen.findByText('Elena Ruiz')).toBeInTheDocument()
    expect(screen.getByText('elena@example.com')).toBeInTheDocument()
  })
})

// --- AUTH GUARD ---
describe('Admin Route Guard', () => {
  function renderAdminRoute(initialEntry = '/admin') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div>Admin Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
  }

  test('redirects to /home if user is not admin', async () => {
    localStorage.setItem('welcome_user', JSON.stringify({ role: 'member' }))
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'auth-1' } } },
      error: null,
    })

    renderAdminRoute()

    expect(await screen.findByText('Home Page')).toBeInTheDocument()
  })

  test('redirects to /login if user is not authenticated', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

    renderAdminRoute()

    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  test('allows access if user has role admin', async () => {
    localStorage.setItem('welcome_user', JSON.stringify({ role: 'admin' }))
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'auth-user-1' } } },
      error: null,
    })

    renderAdminRoute()

    expect(await screen.findByText('Admin Dashboard Content')).toBeInTheDocument()
  })
})
