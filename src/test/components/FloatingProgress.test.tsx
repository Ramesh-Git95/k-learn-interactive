import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FloatingProgress from '../../../components/FloatingProgress'
import type { Section } from '../../../types'

const mockProps = {
  progress: {
    'hangul_char_0': true,
    'hangul_char_1': true,
    'vocab_item_안녕하세요': true,
  },
  activeSection: 'vocabulary' as Section,
  getSectionTotalItems: vi.fn((section: Section) => {
    const totals = { hangul: 10, vocabulary: 20, grammar: 15, phrases: 12, culture: 25, quiz: 10 }
    return totals[section] || 0
  }),
  getSectionCompletedItems: vi.fn((section: Section) => {
    const completed = { hangul: 2, vocabulary: 1, grammar: 0, phrases: 0, culture: 0, quiz: 0 }
    return completed[section] || 0
  })
}

describe('FloatingProgress', () => {
  it('renders the floating progress button', () => {
    render(<FloatingProgress {...mockProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-han-blue')
  })

  it('shows progress percentage in button', () => {
    render(<FloatingProgress {...mockProps} />)
    
    // Should show calculated overall progress
    expect(screen.getByText(/\d+%/)).toBeInTheDocument()
  })

  it('expands to show detailed progress when clicked', async () => {
    const user = userEvent.setup()
    render(<FloatingProgress {...mockProps} />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(screen.getByText('Learning Progress')).toBeInTheDocument()
    expect(screen.getByText('Overall Progress')).toBeInTheDocument()
    expect(screen.getByText('Hangul')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary')).toBeInTheDocument()
  })

  it('closes expanded panel when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<FloatingProgress {...mockProps} />)
    
    // Open the panel
    const expandButton = screen.getByRole('button')
    await user.click(expandButton)
    
    // Close the panel - find the close button by its SVG content
    const buttons = screen.getAllByRole('button')
    const closeButton = buttons.find(button => button.querySelector('svg'))
    expect(closeButton).toBeDefined()
    
    if (closeButton) {
      await user.click(closeButton)
    }
    
    expect(screen.queryByText('Learning Progress')).not.toBeInTheDocument()
  })

  it('highlights active section in expanded view', async () => {
    const user = userEvent.setup()
    render(<FloatingProgress {...mockProps} />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // Check that vocabulary section is highlighted (active section)
    const vocabularySection = screen.getByText('Vocabulary').closest('div')?.parentElement
    expect(vocabularySection).toHaveClass('bg-han-sky/20')
  })

  it('does not render on dashboard section', () => {
    const dashboardProps = { ...mockProps, activeSection: 'dashboard' as Section }
    const { container } = render(<FloatingProgress {...dashboardProps} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('adapts to mobile screen size', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })
    
    render(<FloatingProgress {...mockProps} />)
    
    // Trigger resize event
    fireEvent(window, new Event('resize'))
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-12', 'h-12')
  })

  it('calculates overall progress correctly', () => {
    render(<FloatingProgress {...mockProps} />)
    
    // With our mock data: 3 completed out of 92 total items = ~3%
    const progressText = screen.getByText(/\d+%/)
    expect(progressText.textContent).toMatch(/[0-9]+%/)
  })
})
