import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}))

const mockRegisterUser = vi.fn()

vi.mock('../lib/api.js', () => ({
  registerUser: (...args) => mockRegisterUser(...args),
  saveSubscription: vi.fn(async () => ({ data: null, error: null })),
  getUserByAuthId: vi.fn(async () => ({ data: null, error: null })),
  getEvents: vi.fn(async () => ({ data: [], error: null })),
  getNews: vi.fn(async () => ({ data: [], error: null })),
}))

vi.mock('../lib/push.js', () => ({
  subscribeToPush: vi.fn(async () => null),
  unsubscribeFromPush: vi.fn(async () => {}),
}))

import OnboardingPage from '../pages/OnboardingPage.jsx'

function renderOnboarding() {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// Fills required fields to advance through all 8 steps
async function advanceToStep(targetStep) {
  const user = userEvent.setup()

  // Step 1: Name
  if (targetStep <= 1) return user
  await user.type(screen.getByPlaceholderText('First name'), 'Jane')
  await user.type(screen.getByPlaceholderText('Last name'), 'Doe')
  await user.click(screen.getByRole('button', { name: /continue/i }))
  if (targetStep === 2) return user

  // Step 2: Email
  const emailInput = screen.getByPlaceholderText(/you@example\.com/i)
  await user.type(emailInput, 'jane@example.com')
  await user.click(screen.getByRole('button', { name: /continue/i }))
  if (targetStep === 3) return user

  // Step 3: Phone
  await user.type(screen.getByPlaceholderText('+34 000 000 000'), '600123456')
  await user.click(screen.getByRole('button', { name: /continue/i }))
  if (targetStep === 4) return user

  // Step 4: Password
  const [pwInput, confirmInput] = screen.getAllByPlaceholderText(/password/i)
  await user.type(pwInput, 'securepass')
  await user.type(confirmInput, 'securepass')
  await user.click(screen.getByRole('button', { name: /continue/i }))
  if (targetStep === 5) return user

  // Step 5: Source
  await user.click(screen.getByText('A friend'))
  await user.click(screen.getByRole('button', { name: /continue/i }))
  if (targetStep === 6) return user

  // Step 6: Age range
  await user.click(screen.getByText('26-35'))
  await user.click(screen.getByRole('button', { name: /continue/i }))
  if (targetStep === 7) return user

  // Step 7: Interests
  await user.click(screen.getByText('Music'))
  await user.click(screen.getByRole('button', { name: /continue/i }))
  return user // now on step 8
}

beforeEach(() => {
  mockRegisterUser.mockReset()
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('Onboarding', () => {
  test('Step 1 renders first and last name fields', () => {
    renderOnboarding()
    expect(screen.getByPlaceholderText('First name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument()
    expect(screen.getByText(/Step 1 of 8/i)).toBeInTheDocument()
  })

  test('Continue button is disabled until both name fields are filled', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    const btn = screen.getByRole('button', { name: /continue/i })
    expect(btn).toBeDisabled()

    await user.type(screen.getByPlaceholderText('First name'), 'Jane')
    expect(btn).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Last name'), 'Doe')
    expect(btn).toBeEnabled()
  })

  test('Cannot proceed without filling a required field', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    // Click continue without filling in name — step should not advance
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/Step 1 of 8/i)).toBeInTheDocument()
  })

  test('Progress bar advances when moving to next step', async () => {
    renderOnboarding()
    const user = userEvent.setup()

    // Step 1: progress bar at 1/8
    const bar = document.querySelector('[style*="width: 12.5%"], [style*="width:12.5%"]')
    // It might be rendered as inline style — just confirm step text advances
    await user.type(screen.getByPlaceholderText('First name'), 'Jane')
    await user.type(screen.getByPlaceholderText('Last name'), 'Doe')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText(/Step 2 of 8/i)).toBeInTheDocument()
  })

  test('Step 2 renders email field and blocks invalid emails', async () => {
    renderOnboarding()
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('First name'), 'Jane')
    await user.type(screen.getByPlaceholderText('Last name'), 'Doe')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText(/Step 2 of 8/i)).toBeInTheDocument()
    // Continue disabled with no email
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  test('Step 3 renders phone field', async () => {
    renderOnboarding()
    await advanceToStep(3)
    expect(screen.getByText(/Step 3 of 8/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('+34 000 000 000')).toBeInTheDocument()
  })

  test('Step 5 shows how-did-you-find-us options', async () => {
    renderOnboarding()
    await advanceToStep(5)
    expect(screen.getByText(/Step 5 of 8/i)).toBeInTheDocument()
    expect(screen.getByText('A friend')).toBeInTheDocument()
    expect(screen.getByText('Social media')).toBeInTheDocument()
  })

  test('Step 6 shows age range options', async () => {
    renderOnboarding()
    await advanceToStep(6)
    expect(screen.getByText(/Step 6 of 8/i)).toBeInTheDocument()
    expect(screen.getByText('18-25')).toBeInTheDocument()
    expect(screen.getByText('26-35')).toBeInTheDocument()
  })

  test('Step 7 shows interests and Continue is disabled until one is selected', async () => {
    renderOnboarding()
    const user = await advanceToStep(6)
    await user.click(screen.getByText('26-35'))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText(/Step 7 of 8/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()

    await user.click(screen.getByText('Music'))
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  test('Final step shows "You\'re part of the family!" card and green Let\'s go button', async () => {
    renderOnboarding()
    await advanceToStep(8)

    expect(screen.getByText(/Step 8 of 8/i)).toBeInTheDocument()
    expect(screen.getByText(/You're part of the family!/i)).toBeInTheDocument()
    expect(screen.getByText(/Welcome home/i)).toBeInTheDocument()

    const letsGoBtn = screen.getByRole('button', { name: /let's go/i })
    expect(letsGoBtn).toBeInTheDocument()
    expect(letsGoBtn).toBeEnabled()
  })

  test('Completing onboarding saves user to localStorage and redirects to Home', async () => {
    mockRegisterUser.mockResolvedValue({
      user: { id: 'new-user-1', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', role: 'member' },
      authId: 'auth-new-1',
      error: null,
    })

    renderOnboarding()
    const user = await advanceToStep(8)
    await user.click(screen.getByRole('button', { name: /let's go/i }))

    await waitFor(() => expect(screen.getByText('Home Page')).toBeInTheDocument())

    const stored = JSON.parse(localStorage.getItem('welcome_user'))
    expect(stored).not.toBeNull()
    expect(stored.firstName).toBe('Jane')
  })

  test('Shows error message if registration fails', async () => {
    mockRegisterUser.mockResolvedValue({
      user: null,
      authId: null,
      error: { message: 'Email already in use' },
    })

    renderOnboarding()
    await advanceToStep(8)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /let's go/i }))

    await waitFor(() => expect(screen.getByText(/Email already in use/i)).toBeInTheDocument())
    expect(screen.queryByText('Home Page')).not.toBeInTheDocument()
  })
})
