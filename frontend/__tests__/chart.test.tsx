import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChartContainer, ChartConfig } from '../components/ui/chart'
import React from 'react'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

describe('Chart Component', () => {
  const mockConfig: ChartConfig = {
    desktop: {
      label: 'Desktop',
      color: 'hsl(var(--chart-1))',
    },
    mobile: {
      label: 'Mobile',
      color: 'hsl(var(--chart-2))',
    },
  }

  it('should render ChartContainer without crashing', () => {
    render(
      <ChartContainer config={mockConfig}>
        <div data-testid="chart-child">Chart Content</div>
      </ChartContainer>
    )

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('chart-child')).toBeInTheDocument()
  })

  it('should inject correct custom color properties in style tag', () => {
    const { container } = render(
      <ChartContainer config={mockConfig} id="test-chart">
        <div />
      </ChartContainer>
    )

    const styleTag = container.querySelector('style')
    expect(styleTag).toBeInTheDocument()
    expect(styleTag?.innerHTML).toContain('--color-desktop')
    expect(styleTag?.innerHTML).toContain('hsl(var(--chart-1))')
    expect(styleTag?.innerHTML).toContain('--color-mobile')
    expect(styleTag?.innerHTML).toContain('hsl(var(--chart-2))')
  })
})
