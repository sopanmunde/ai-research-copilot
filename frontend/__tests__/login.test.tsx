import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuthPage from '../app/(root)/(auth)/login/[[...sign-in]]/page'
import React from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key) => {
      if (key === 'code') return null
      return null
    }),
  }),
}))

vi.mock('framer-motion', () => {
  const motionComp = (Tag: keyof React.JSX.IntrinsicElements) => {
    const Component = ({ children, ...props }: React.ComponentPropsWithoutRef<typeof Tag>) => {
      const { initial, animate, exit, transition, whileHover, ...cleanProps } = props as Record<string, unknown>
      return React.createElement(Tag, cleanProps, children)
    }
    Component.displayName = `motion.${Tag}`
    return Component
  }
  return {
    motion: {
      div: motionComp('div'),
      button: motionComp('button'),
      p: motionComp('p'),
      path: motionComp('path'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  }
})

vi.mock('@/components/TriVisionXLogo', () => ({
  TriVisionXLogo: () => <div data-testid="trivisionx-logo">Logo</div>,
}))

describe('Login Page', () => {
  it('should render the login form with email and password fields', () => {
    render(<AuthPage />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should toggle password visibility on clicking eye icon', () => {
    render(<AuthPage />)
    
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    const eyeButton = screen.getByRole('button', { name: '' }) // eye button has no text content
    fireEvent.click(eyeButton)

    expect(passwordInput.type).toBe('text')
  })

  it('should show loading spinner and disable sign in button during submission', async () => {
    const mockFetch = vi.fn().mockImplementation(() => 
      new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'fake-token' }),
      }), 50))
    )
    vi.stubGlobal('fetch', mockFetch)

    render(<AuthPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitBtn = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    fireEvent.click(submitBtn)

    expect(submitBtn).toBeDisabled()
    
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled()
    })

    vi.unstubAllGlobals()
  })
})
