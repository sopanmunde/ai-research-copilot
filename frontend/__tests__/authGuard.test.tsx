import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthGuard } from '../components/auth/AuthGuard'
import React from 'react'

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
}))

describe('AuthGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.cookie = "auth_token=; path=/; max-age=0"
  })

  it('should redirect to /login if user is not authenticated', async () => {
    render(
      <AuthGuard>
        <div data-testid="protected-content">Protected Page Content</div>
      </AuthGuard>
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should render children if user has token in localStorage', async () => {
    localStorage.setItem('token', 'fake-jwt-token')

    render(
      <AuthGuard>
        <div data-testid="protected-content">Protected Page Content</div>
      </AuthGuard>
    )

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('should render children if user has auth_token cookie', async () => {
    document.cookie = "auth_token=fake-token; path=/"

    render(
      <AuthGuard>
        <div data-testid="protected-content">Protected Page Content</div>
      </AuthGuard>
    )

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
