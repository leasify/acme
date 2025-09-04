import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateReportModal } from '../CreateReportModal'
import { ApiError } from '../../services/api'
import * as apiModule from '../../services/api'

// Mock the API client
vi.mock('../../services/api', () => ({
  apiClient: {
    createReport: vi.fn(),
  },
  ApiError: class extends Error {
    constructor(public status: number, message: string, public errors?: Record<string, string[]>) {
      super(message)
      this.name = 'ApiError'
    }
  }
}))

const mockApiClient = vi.mocked(apiModule.apiClient)

const mockTemplates = [
  {
    id: 1,
    name: 'IFRS 16 Standard Template',
    generator_template: false,
    children: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Local GAAP Template',
    generator_template: true,
    children: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  templates: mockTemplates,
  onSuccess: vi.fn()
}

describe('CreateReportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when closed', () => {
    render(<CreateReportModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Create New Report')).not.toBeInTheDocument()
  })

  it('renders modal when open', () => {
    render(<CreateReportModal {...defaultProps} />)
    
    expect(screen.getByText('Create New Report')).toBeInTheDocument()
    expect(screen.getByLabelText('Report Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Report Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Template')).toBeInTheDocument()
    expect(screen.getByLabelText('Break Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Duration (Months)')).toBeInTheDocument()
  })

  it('displays all form fields with correct default values', () => {
    render(<CreateReportModal {...defaultProps} />)
    
    const typeSelect = screen.getByLabelText('Report Type') as HTMLSelectElement
    const monthsInput = screen.getByLabelText('Duration (Months)') as HTMLInputElement
    const languageSelect = screen.getByLabelText('Language') as HTMLSelectElement
    
    expect(typeSelect.value).toBe('IFRS16') // Default report type
    expect(monthsInput.value).toBe('12') // Default months
    expect(languageSelect.value).toBe('') // Default language (empty)
  })

  it('populates template options correctly', () => {
    render(<CreateReportModal {...defaultProps} />)
    
    const templateSelect = screen.getByLabelText('Template')
    expect(templateSelect).toBeInTheDocument()
    
    // Check if template options are present
    expect(screen.getByRole('option', { name: 'Select a template...' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'IFRS 16 Standard Template' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Local GAAP Template' })).toBeInTheDocument()
  })

  it('handles form input changes', async () => {
    const user = userEvent.setup()
    render(<CreateReportModal {...defaultProps} />)
    
    const nameInput = screen.getByLabelText('Report Name')
    await user.type(nameInput, 'Q4 2024 Report')
    
    expect(screen.getByDisplayValue('Q4 2024 Report')).toBeInTheDocument()
  })

  it('handles successful report creation', async () => {
    const user = userEvent.setup()
    const mockCreatedReport = {
      id: 123,
      name: 'Test Report',
      type: 'IFRS16' as const,
      template_id: 1,
      template: { id: 1, name: 'IFRS 16 Standard Template' },
      break_at: '2024-12-31',
      months: 12,
      status: 'pending' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    mockApiClient.createReport.mockResolvedValue(mockCreatedReport)

    render(<CreateReportModal {...defaultProps} />)
    
    // Fill in required fields
    const nameInput = screen.getByLabelText('Report Name')
    await user.type(nameInput, 'Test Report')
    
    const templateSelect = screen.getByLabelText('Template')
    await user.selectOptions(templateSelect, '1')
    
    const breakDateInput = screen.getByLabelText('Break Date')
    await user.type(breakDateInput, '2024-12-31')
    
    const submitButton = screen.getByRole('button', { name: /create report/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockApiClient.createReport).toHaveBeenCalledWith({
        name: 'Test Report',
        type: 'IFRS16',
        template_id: 1,
        break_at: '2024-12-31',
        months: 12
      })
    })
    
    expect(defaultProps.onSuccess).toHaveBeenCalledWith(mockCreatedReport)
  })

  it('handles validation errors', async () => {
    const user = userEvent.setup()
    const validationError = new ApiError(422, 'Validation failed', {
      name: ['Name is required'],
      template_id: ['Template is required']
    })

    mockApiClient.createReport.mockRejectedValue(validationError)

    render(<CreateReportModal {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /create report/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    
    // Make createReport hang to test loading state
    mockApiClient.createReport.mockReturnValue(new Promise(() => {}))

    render(<CreateReportModal {...defaultProps} />)
    
    // Fill in required fields
    const nameInput = screen.getByLabelText('Report Name')
    await user.type(nameInput, 'Test Report')
    
    const templateSelect = screen.getByLabelText('Template')
    await user.selectOptions(templateSelect, '1')
    
    const breakDateInput = screen.getByLabelText('Break Date')
    await user.type(breakDateInput, '2024-12-31')
    
    const submitButton = screen.getByRole('button', { name: /create report/i })
    await user.click(submitButton)
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('disables submit button when required fields are empty', async () => {
    render(<CreateReportModal {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /create report/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when required fields are filled', async () => {
    const user = userEvent.setup()
    render(<CreateReportModal {...defaultProps} />)
    
    const nameInput = screen.getByLabelText('Report Name')
    await user.type(nameInput, 'Test Report')
    
    const templateSelect = screen.getByLabelText('Template')
    await user.selectOptions(templateSelect, '1')
    
    const submitButton = screen.getByRole('button', { name: /create report/i })
    expect(submitButton).toBeEnabled()
  })

  it('closes modal and resets form on cancel', async () => {
    const user = userEvent.setup()
    render(<CreateReportModal {...defaultProps} />)
    
    // Fill in some data
    const nameInput = screen.getByLabelText('Report Name')
    await user.type(nameInput, 'Test Report')
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('prevents closing modal during submission', async () => {
    const user = userEvent.setup()
    
    // Make createReport hang
    mockApiClient.createReport.mockReturnValue(new Promise(() => {}))

    render(<CreateReportModal {...defaultProps} />)
    
    // Fill in required fields and submit
    const nameInput = screen.getByLabelText('Report Name')
    await user.type(nameInput, 'Test Report')
    
    const templateSelect = screen.getByLabelText('Template')
    await user.selectOptions(templateSelect, '1')
    
    const breakDateInput = screen.getByLabelText('Break Date')
    await user.type(breakDateInput, '2024-12-31')
    
    const submitButton = screen.getByRole('button', { name: /create report/i })
    await user.click(submitButton)
    
    // Try to cancel during loading
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    expect(cancelButton).toBeDisabled()
  })

  it('handles optional fields correctly', async () => {
    const user = userEvent.setup()
    const mockCreatedReport = {
      id: 123,
      name: 'Advanced Report',
      type: 'LOCALGAAP' as const,
      template_id: 2,
      template: { id: 2, name: 'Local GAAP Template' },
      break_at: '2024-12-31',
      months: 6,
      years: 2,
      language: 'sv',
      webhook: 'https://webhook.example.com',
      status: 'pending' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    mockApiClient.createReport.mockResolvedValue(mockCreatedReport)

    render(<CreateReportModal {...defaultProps} />)
    
    // Fill in all fields including optional ones
    const nameInput = screen.getByLabelText('Report Name')
    await user.type(nameInput, 'Advanced Report')
    
    const typeSelect = screen.getByLabelText('Report Type')
    await user.selectOptions(typeSelect, 'LOCALGAAP')
    
    const templateSelect = screen.getByLabelText('Template')
    await user.selectOptions(templateSelect, '2')
    
    const breakDateInput = screen.getByLabelText('Break Date')
    await user.type(breakDateInput, '2024-12-31')
    
    const monthsInput = screen.getByLabelText('Duration (Months)')
    await user.clear(monthsInput)
    await user.type(monthsInput, '6')
    
    const yearsInput = screen.getByLabelText('Years (Optional)')
    await user.type(yearsInput, '2')
    
    const languageSelect = screen.getByLabelText('Language')
    await user.selectOptions(languageSelect, 'sv')
    
    const webhookInput = screen.getByLabelText('Webhook URL (Optional)')
    await user.type(webhookInput, 'https://webhook.example.com')
    
    const submitButton = screen.getByRole('button', { name: /create report/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockApiClient.createReport).toHaveBeenCalledWith({
        name: 'Advanced Report',
        type: 'LOCALGAAP',
        template_id: 2,
        break_at: '2024-12-31',
        months: 6,
        years: 2,
        language: 'sv',
        webhook: 'https://webhook.example.com'
      })
    })
  })

  it('displays informational content correctly', () => {
    render(<CreateReportModal {...defaultProps} />)
    
    expect(screen.getByText('Report Creation Info')).toBeInTheDocument()
    expect(screen.getByText(/Reports are processed asynchronously/)).toBeInTheDocument()
    expect(screen.getByText(/You can track the progress/)).toBeInTheDocument()
    expect(screen.getByText(/Webhook notifications will be sent/)).toBeInTheDocument()
  })

  it('resets form after successful creation', async () => {
    const user = userEvent.setup()
    const mockCreatedReport = {
      id: 123,
      name: 'Test Report',
      type: 'IFRS16' as const,
      template_id: 1,
      template: { id: 1, name: 'IFRS 16 Standard Template' },
      break_at: '2024-12-31',
      months: 12,
      status: 'pending' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    mockApiClient.createReport.mockResolvedValue(mockCreatedReport)

    render(<CreateReportModal {...defaultProps} />)
    
    // Fill in form
    const nameInput = screen.getByLabelText('Report Name')
    await user.type(nameInput, 'Test Report')
    
    const templateSelect = screen.getByLabelText('Template')
    await user.selectOptions(templateSelect, '1')
    
    const breakDateInput = screen.getByLabelText('Break Date')
    await user.type(breakDateInput, '2024-12-31')
    
    const submitButton = screen.getByRole('button', { name: /create report/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled()
    })

    // Form should reset to default values
    expect(nameInput).toHaveValue('')
    expect(templateSelect).toHaveValue('')
    expect(breakDateInput).toHaveValue('')
  })
})