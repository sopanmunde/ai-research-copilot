import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ComposerActionsPopover from '../components/ComposerActionsPopover'
import SettingsPopover from '../components/SettingsPopover'
import { UserProfileModal } from '../components/UserProfileModal'
import React from 'react'

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
    systemTheme: 'dark',
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, ...cleanProps } = props
      return <div {...cleanProps}>{children}</div>
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, ...cleanProps } = props
      return <button {...cleanProps}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))


describe('Popovers & Modals Components', () => {
  describe('ComposerActionsPopover', () => {
    it('should render trigger button', () => {
      render(
        <ComposerActionsPopover onFileSelect={vi.fn()}>
          <button data-testid="trigger">Open Actions</button>
        </ComposerActionsPopover>
      )
      expect(screen.getByTestId('popover-trigger')).toBeInTheDocument()
    })
  })

  describe('SettingsPopover', () => {
    it('should render popover with triggers', () => {
      render(
        <SettingsPopover>
          <button>Settings</button>
        </SettingsPopover>
      )
      expect(screen.getByTestId('popover-trigger')).toBeInTheDocument()
    })
  })

  describe('UserProfileModal', () => {
    it('should render form fields when isOpen is true', async () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn().mockReturnValue('fake-jwt-token'),
        setItem: vi.fn(),
      })

      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
            email: 'john@example.com',
          }),
        })
      )
      vi.stubGlobal('fetch', mockFetch)

      render(
        <UserProfileModal isOpen={true} onClose={vi.fn()} onUpdate={vi.fn()} />
      )

      expect(screen.getByTestId('dialog-root')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
      })

      vi.unstubAllGlobals()
    })
  })
})
