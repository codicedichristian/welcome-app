import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import { mockSupabase, resetMockSupabase } from './mocks/supabase.js'

vi.mock('../lib/supabase.js', () => ({ supabase: mockSupabase }))

const mockGetUserByAuthId = vi.fn()

vi.mock('../lib/api.js', () => ({
  getUserByAuthId: (...args) => mockGetUserByAuthId(...args),
  saveSubscription: vi.fn(async () => ({ data: null, error: null })),
  deleteSubscription: vi.fn(async () => ({ data: null, error: null })),
  getEvents: vi.fn(async () => ({ data: [], error: null })),
  getNews: vi.fn(async () => ({ data: [], error: null })),
}))

vi.mock('../lib/push.js', () => ({
  subscribeToPush: vi.fn(async () => null),
  unsubscribeFromPush: vi.fn(async () => {}),
}))

import LoginPage from '../pages/LoginPage.jsx'
import RightPanel from '../components/RightPanel.jsx'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderPanel(isOpen = true, user = {}) {
  localStorage.setItem('welcome_user', JSON.stringify(user))
  const onClose = vi.fn()
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<div><RightPanel isOpen={isOpen} onClose={onClose} /></div>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/edit-info" element={<div>Edit Info</div>} />
        <Route path="/admin" element={<div>Admin Panel</div>} />
      </Routes>
    </MemoryRouter>,
  )
  return { onClose }
}

beforeEach(() => {
  resetMockSupabase()
  mockGetUserByAuthId.mockReset()
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('Login Page', () => {
  test('Renders email and password fields', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument()
  })

  test('Sign in button is disabled when fields are empty', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
  })

  test('Sign in button is enabled when both fields are filled', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'alice@example.com')
    await user.type(screen.getByPlaceholderText(/^password$/i), 'secret123')

    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
  })

  test('Shows error on wrong credentials', async () => {
    const user = userEvent.setup()
    mockSupabase.auth.signInWithPassword = vi.fn(async () => ({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    }))

    renderLogin()
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'wrong@example.com')
    await user.type(screen.getByPlaceholderText(/^password$/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })

  test('Redirects to home on successful login', async () => {
    const user = userEvent.setup()

    mockSupabase.auth.signInWithPassword = vi.fn(async () => ({
      data: { user: { id: 'auth-user-1' } },
      error: null,
    }))

    mockGetUserByAuthId.mockResolvedValue({
      data: {
        id: 'usr-1',
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        role: 'member',
      },
      error: null,
    })

    renderLogin()
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'alice@example.com')
    await user.type(screen.getByPlaceholderText(/^password$/i), 'correct-pass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByText('Home Page')).toBeInTheDocument())

    const stored = JSON.parse(localStorage.getItem('welcome_user'))
    expect(stored.firstName).toBe('Alice')
  })

  test('Forgot password link shows reset form', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /forgot password/i }))
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument()
  })
})

describe('Sign out', () => {
  test('Sign out clears localStorage and redirects to login', async () => {
    const user = userEvent.setup()
    mockSupabase.auth.signOut = vi.fn(async () => ({ error: null }))
    localStorage.setItem('welcome_user', JSON.stringify({ id: 'usr-1', firstName: 'Alice', role: 'member' }))

    renderPanel(true, { id: 'usr-1', firstName: 'Alice', role: 'member' })

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument())
    expect(localStorage.getItem('welcome_user')).toBeNull()
  })
})

describe('Admin Panel button', () => {
  test('Admin user sees Admin Panel button in profile panel', () => {
    renderPanel(true, { id: 'usr-4', firstName: 'David', role: 'admin' })
    expect(screen.getByRole('button', { name: /admin panel/i })).toBeInTheDocument()
  })

  test('Regular member does not see Admin Panel button', () => {
    renderPanel(true, { id: 'usr-1', firstName: 'Alice', role: 'member' })
    expect(screen.queryByRole('button', { name: /admin panel/i })).not.toBeInTheDocument()
  })
})
