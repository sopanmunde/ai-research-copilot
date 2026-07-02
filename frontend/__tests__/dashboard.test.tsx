import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import DocumentLibrary from '../components/DocumentLibrary'
import React from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
    systemTheme: 'dark',
  }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, layoutId, ...cleanProps } = props
      return <div {...cleanProps}>{children}</div>
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, layoutId, ...cleanProps } = props
      return <button {...cleanProps}>{children}</button>
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, layoutId, ...cleanProps } = props
      return <span {...cleanProps}>{children}</span>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('../components/TriVisionXLogo', () => ({
  TriVisionXLogo: () => <div data-testid="sidebar-logo">Logo</div>,
}))

describe('Dashboard Components', () => {
  describe('Sidebar', () => {
    it('should render the Sidebar component', () => {
      render(
        <Sidebar 
          conversations={[]} 
          folders={[]} 
          templates={[]}
          currentConversationId={null}
          onSelectConversation={vi.fn()}
          onDeleteConversation={vi.fn()}
          onRenameConversation={vi.fn()}
          onCreateFolder={vi.fn()}
          onCreateTemplate={vi.fn()}
          onSelectTemplate={vi.fn()}
        />
      )

      expect(screen.getAllByTestId('sidebar-logo')[0]).toBeInTheDocument()
      expect(screen.getAllByText(/new chat/i)[0]).toBeInTheDocument()
      expect(screen.getAllByText(/folders/i)[0]).toBeInTheDocument()
      expect(screen.getAllByText(/templates/i)[0]).toBeInTheDocument()
      expect(screen.getByText(/recent/i)).toBeInTheDocument()
    })
  })

  describe('Header', () => {
    it('should render the Header component', () => {
      render(
        <Header 
          createNewChat={vi.fn()} 
          sidebarCollapsed={false}
          setSidebarOpen={vi.fn()} 
        />
      )
      
      expect(screen.getByLabelText('Open sidebar')).toBeInTheDocument()
    })
  })


  describe('DocumentLibrary', () => {
    it('should render the library container with upload button', async () => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      ))

      render(
        <DocumentLibrary 
          open={true} 
          onClose={vi.fn()} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/document library/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
      })

      vi.unstubAllGlobals()
    })
  })
})
