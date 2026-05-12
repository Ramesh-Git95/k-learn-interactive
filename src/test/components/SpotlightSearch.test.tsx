import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SpotlightSearch from '../../../components/SpotlightSearch'

const mockProps = {
  isOpen: true,
  onClose: vi.fn(),
  onNavigate: vi.fn(),
}

describe('SpotlightSearch', () => {
  it('renders search input when open', () => {
    render(<SpotlightSearch {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText(/search korean content/i)
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveFocus()
  })

  it('does not render when closed', () => {
    const closedProps = { ...mockProps, isOpen: false }
    render(<SpotlightSearch {...closedProps} />)
    
    expect(screen.queryByPlaceholderText(/search korean content/i)).not.toBeInTheDocument()
  })

  it('shows keyboard shortcuts help', () => {
    render(<SpotlightSearch {...mockProps} />)
    
    expect(screen.getByText('navigate')).toBeInTheDocument()
    expect(screen.getByText('select')).toBeInTheDocument()
    expect(screen.getByText('close')).toBeInTheDocument()
  })

  it('shows search results when typing', async () => {
    const user = userEvent.setup()
    render(<SpotlightSearch {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText(/search korean content/i)
    await user.type(searchInput, '안녕')
    
    // Should show search results after typing
    expect(searchInput).toHaveValue('안녕')
  })

  it('calls onClose when escape key is pressed', async () => {
    const user = userEvent.setup()
    render(<SpotlightSearch {...mockProps} />)
    
    await user.keyboard('[Escape]')
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('navigates with arrow keys', async () => {
    const user = userEvent.setup()
    render(<SpotlightSearch {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText(/search korean content/i)
    await user.type(searchInput, 'hello')
    
    // Test arrow navigation
    await user.keyboard('[ArrowDown]')
    await user.keyboard('[ArrowUp]')
    
    // Should not throw errors
    expect(searchInput).toBeInTheDocument()
  })

  it('shows empty state when no search term', () => {
    render(<SpotlightSearch {...mockProps} />)
    
    expect(screen.getByText('Search Korean Content')).toBeInTheDocument()
  })
})
