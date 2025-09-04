import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../Input'

describe('Input', () => {
  it('renders basic input', () => {
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md')
  })

  it('renders with label', () => {
    render(<Input label="Email Address" placeholder="Enter email" />)
    
    const label = screen.getByText('Email Address')
    const input = screen.getByPlaceholderText('Enter email')
    
    expect(label).toBeInTheDocument()
    expect(label).toHaveClass('block', 'text-sm', 'font-medium')
    expect(input).toHaveAttribute('id', 'email-address')
  })

  it('renders with error state', () => {
    render(<Input label="Email" error="Email is required" />)
    
    const input = screen.getByLabelText('Email')
    const errorText = screen.getByText('Email is required')
    
    expect(input).toHaveClass('border-red-500', 'focus:ring-red-500')
    expect(errorText).toBeInTheDocument()
    expect(errorText).toHaveClass('text-sm', 'text-red-400')
  })

  it('handles input changes', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} placeholder="Type here" />)
    
    const input = screen.getByPlaceholderText('Type here')
    fireEvent.change(input, { target: { value: 'test input' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'test input' })
    }))
  })

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number')
  })

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />)
    
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('can be required', () => {
    render(<Input required placeholder="Required field" />)
    
    const input = screen.getByPlaceholderText('Required field')
    expect(input).toBeRequired()
  })

  it('accepts custom id', () => {
    render(<Input id="custom-id" label="Custom Field" />)
    
    const input = screen.getByLabelText('Custom Field')
    expect(input).toHaveAttribute('id', 'custom-id')
  })

  it('generates id from label when no id provided', () => {
    render(<Input label="Full Name" />)
    
    const input = screen.getByLabelText('Full Name')
    expect(input).toHaveAttribute('id', 'full-name')
  })

  it('accepts custom className', () => {
    render(<Input className="custom-input-class" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input-class')
  })

  it('shows placeholder text', () => {
    render(<Input placeholder="Enter your username" />)
    
    const input = screen.getByPlaceholderText('Enter your username')
    expect(input).toHaveAttribute('placeholder', 'Enter your username')
    expect(input).toHaveClass('placeholder:text-gray-400')
  })

  it('focuses on input when clicked', () => {
    render(<Input data-testid="focus-input" />)
    
    const input = screen.getByTestId('focus-input')
    input.focus()
    
    expect(input).toHaveFocus()
  })
})