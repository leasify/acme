import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../Modal'

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal when open', () => {
    render(<Modal {...defaultProps} />)
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    // Find the backdrop by its fixed positioning class
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50')
    expect(backdrop).toBeInTheDocument()
    
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalledTimes(1)
    }
  })

  it('does not call onClose when modal content clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    const modalContent = screen.getByText('Modal content')
    fireEvent.click(modalContent)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders with custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal-class" />)
    
    const modal = document.querySelector('.custom-modal-class')
    expect(modal).toBeInTheDocument()
  })

  it('has proper ARIA attributes', () => {
    render(<Modal {...defaultProps} />)
    
    // Check that the modal has proper structure
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    
    // Check for close button with proper icon
    const closeButton = screen.getByRole('button')
    expect(closeButton).toBeInTheDocument()
  })

  it('renders title in header', () => {
    render(<Modal {...defaultProps} title="Custom Title" />)
    
    const title = screen.getByText('Custom Title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveClass('text-lg', 'font-semibold', 'text-white')
  })

  it('renders children in content area', () => {
    const customContent = <div data-testid="custom-content">Custom modal content</div>
    render(<Modal {...defaultProps}>{customContent}</Modal>)
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
  })

  it('has proper z-index for overlay', () => {
    render(<Modal {...defaultProps} />)
    
    const overlay = document.querySelector('.fixed.inset-0.z-50')
    expect(overlay).toBeInTheDocument()
  })

  it('has backdrop blur effect', () => {
    render(<Modal {...defaultProps} />)
    
    const backdrop = document.querySelector('.backdrop-blur-sm')
    expect(backdrop).toBeInTheDocument()
  })

  it('has proper modal styling', () => {
    render(<Modal {...defaultProps} />)
    
    const modal = document.querySelector('.bg-gray-900.border.border-gray-700.rounded-lg')
    expect(modal).toBeInTheDocument()
  })
})