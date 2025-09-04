import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '../Select'

const mockOptions = [
  { value: '', label: 'Select an option...' },
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' }
]

describe('Select', () => {
  it('renders basic select', () => {
    render(<Select options={mockOptions} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md')
  })

  it('renders with label', () => {
    render(<Select label="Choose Option" options={mockOptions} />)
    
    const label = screen.getByText('Choose Option')
    const select = screen.getByRole('combobox')
    
    expect(label).toBeInTheDocument()
    expect(label).toHaveClass('block', 'text-sm', 'font-medium')
    expect(select).toHaveAttribute('id', 'choose-option')
  })

  it('renders all options', () => {
    render(<Select options={mockOptions} />)
    
    mockOptions.forEach(option => {
      expect(screen.getByRole('option', { name: option.label })).toBeInTheDocument()
    })
  })

  it('handles selection changes', () => {
    const handleChange = vi.fn()
    render(<Select options={mockOptions} onChange={handleChange} />)
    
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'option2' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'option2' })
    }))
  })

  it('renders with error state', () => {
    render(<Select label="Category" options={mockOptions} error="Category is required" />)
    
    const select = screen.getByLabelText('Category')
    const errorText = screen.getByText('Category is required')
    
    expect(select).toHaveClass('border-red-500', 'focus:ring-red-500')
    expect(errorText).toBeInTheDocument()
    expect(errorText).toHaveClass('text-sm', 'text-red-400')
  })

  it('can be disabled', () => {
    render(<Select disabled options={mockOptions} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
    expect(select).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('can be required', () => {
    render(<Select required options={mockOptions} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeRequired()
  })

  it('accepts custom id', () => {
    render(<Select id="custom-select" label="Custom Select" options={mockOptions} />)
    
    const select = screen.getByLabelText('Custom Select')
    expect(select).toHaveAttribute('id', 'custom-select')
  })

  it('generates id from label when no id provided', () => {
    render(<Select label="Report Type" options={mockOptions} />)
    
    const select = screen.getByLabelText('Report Type')
    expect(select).toHaveAttribute('id', 'report-type')
  })

  it('accepts custom className', () => {
    render(<Select className="custom-select-class" options={mockOptions} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('custom-select-class')
  })

  it('sets default value', () => {
    render(<Select value="option2" options={mockOptions} />)
    
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('option2')
  })

  it('handles numeric values', () => {
    const numericOptions = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
      { value: 3, label: 'Three' }
    ]

    render(<Select options={numericOptions} value={2} />)
    
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('2')
  })

  it('has proper focus styles', () => {
    render(<Select options={mockOptions} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500')
  })

  it('has proper dark theme styling', () => {
    render(<Select options={mockOptions} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('bg-gray-800', 'text-white', 'border-gray-600')
  })

  it('renders empty options array', () => {
    render(<Select options={[]} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select.children).toHaveLength(0)
  })
})