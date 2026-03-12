import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock the Supabase client
const mockSignInWithOtp = vi.fn()
const mockSetSession = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
      setSession: mockSetSession,
    },
  }),
}))

import LoginPage from './page'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the login form with email input and submit button', () => {
    render(<LoginPage />)
    expect(screen.getByText('SelahOS')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByText('Send magic link')).toBeInTheDocument()
  })

  it('renders email input with correct type', () => {
    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('Email')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toBeRequired()
  })

  it('updates email value on input change', () => {
    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('shows success message after successful magic link send', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })

    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByText('Send magic link'))

    await waitFor(() => {
      expect(screen.getByText('Check your email for the login link.')).toBeInTheDocument()
    })

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      },
    })
  })

  it('shows error message on failed magic link send', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({
      error: { message: 'Rate limit exceeded' },
    })

    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByText('Send magic link'))

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument()
    })
  })

  it('clears previous error when retrying', async () => {
    mockSignInWithOtp
      .mockResolvedValueOnce({ error: { message: 'First error' } })
      .mockResolvedValueOnce({ error: null })

    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    // First attempt - error
    fireEvent.click(screen.getByText('Send magic link'))
    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument()
    })

    // Second attempt - success (error should be cleared)
    fireEvent.click(screen.getByText('Send magic link'))
    await waitFor(() => {
      expect(screen.getByText('Check your email for the login link.')).toBeInTheDocument()
    })
  })
})
