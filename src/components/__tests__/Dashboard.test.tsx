import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Dashboard } from '../Dashboard'
import { AuthProvider } from '../../contexts/AuthContext'
import * as apiModule from '../../services/api'

// Mock the API client
vi.mock('../../services/api', () => ({
  apiClient: {
    getReports: vi.fn(),
    getTemplates: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn(),
    whoami: vi.fn()
  }
}))

// Mock the CreateReportModal component
vi.mock('../CreateReportModal', () => ({
  CreateReportModal: ({ isOpen, onClose, onSuccess }: any) => (
    <div data-testid="create-report-modal" style={{ display: isOpen ? 'block' : 'none' }}>
      <button onClick={onClose}>Close Modal</button>
      <button onClick={() => onSuccess({ id: 999, name: 'New Report' })}>Create Report</button>
    </div>
  )
}))

const mockApiClient = vi.mocked(apiModule.apiClient)

const mockUser = {
  id: 1,
  email: 'test@acme.com',
  name: 'John Doe',
  company: { id: 1, name: 'ACME Corporation' }
}

const mockTemplates = [
  {
    id: 1,
    name: 'IFRS 16 Template',
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

const mockReports = [
  {
    id: 1,
    name: 'Q4 2024 IFRS Report',
    type: 'IFRS16' as const,
    template_id: 1,
    template: { id: 1, name: 'IFRS 16 Template' },
    break_at: '2024-12-31',
    months: 12,
    status: 'finished' as const,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  },
  {
    id: 2,
    name: 'Q3 2024 Local GAAP',
    type: 'LOCALGAAP' as const,
    template_id: 2,
    template: { id: 2, name: 'Local GAAP Template' },
    break_at: '2024-09-30',
    months: 6,
    status: 'processing' as const,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-10T08:30:00Z'
  }
]

// Custom AuthProvider that provides a mock user
const TestAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authContextValue = {
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
  }

  return (
    <div>
      {/* Mock the useAuth hook */}
      {children}
    </div>
  )
}

// Mock useAuth hook
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser,
      logout: vi.fn()
    })
  }
})

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiClient.getReports.mockResolvedValue(mockReports)
    mockApiClient.getTemplates.mockResolvedValue(mockTemplates)
  })

  it('renders dashboard with user information', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })

    // Check header elements
    expect(screen.getByText('ACME')).toBeInTheDocument()
    expect(screen.getByText('Report Management')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('ACME Corporation')).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    // Make API calls hang to test loading state
    mockApiClient.getReports.mockReturnValue(new Promise(() => {}))
    mockApiClient.getTemplates.mockReturnValue(new Promise(() => {}))

    render(<Dashboard />)

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
  })

  it('loads and displays reports', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Q4 2024 IFRS Report')).toBeInTheDocument()
    })

    expect(screen.getByText('Q3 2024 Local GAAP')).toBeInTheDocument()
    expect(screen.getByText('IFRS16')).toBeInTheDocument()
    expect(screen.getByText('LOCALGAAP')).toBeInTheDocument()
    expect(screen.getByText('finished')).toBeInTheDocument()
    expect(screen.getByText('processing')).toBeInTheDocument()
  })

  it('displays empty state when no reports', async () => {
    mockApiClient.getReports.mockResolvedValue([])

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('No reports found')).toBeInTheDocument()
    })

    expect(screen.getByText('Create your first report to get started')).toBeInTheDocument()
  })

  it('handles refresh functionality', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshButton)

    // API should be called again
    expect(mockApiClient.getReports).toHaveBeenCalledTimes(2)
    expect(mockApiClient.getTemplates).toHaveBeenCalledTimes(2)
  })

  it('opens create report modal', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })

    const createButton = screen.getByRole('button', { name: /create report/i })
    fireEvent.click(createButton)

    expect(screen.getByTestId('create-report-modal')).toBeVisible()
  })

  it('closes create report modal', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })

    // Open modal
    const createButton = screen.getByRole('button', { name: /create report/i })
    fireEvent.click(createButton)

    // Close modal
    const closeButton = screen.getByText('Close Modal')
    fireEvent.click(closeButton)

    expect(screen.getByTestId('create-report-modal')).not.toBeVisible()
  })

  it('adds new report when created successfully', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })

    // Open modal and create report
    const createButton = screen.getByRole('button', { name: /create report/i })
    fireEvent.click(createButton)

    const createReportButton = screen.getByText('Create Report')
    fireEvent.click(createReportButton)

    // Modal should close and new report should be added
    expect(screen.getByTestId('create-report-modal')).not.toBeVisible()
  })

  it('formats dates correctly', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Jan 15, 2024, 10:30 AM')).toBeInTheDocument()
    })

    expect(screen.getByText('Jan 10, 2024, 08:00 AM')).toBeInTheDocument()
  })

  it('displays correct status colors', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })

    const finishedStatus = screen.getByText('finished')
    const processingStatus = screen.getByText('processing')

    expect(finishedStatus).toHaveClass('text-green-400', 'bg-green-400/10')
    expect(processingStatus).toHaveClass('text-yellow-400', 'bg-yellow-400/10')
  })

  it('displays correct type colors', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })

    const ifrsType = screen.getByText('IFRS16')
    const localgaapType = screen.getByText('LOCALGAAP')

    expect(ifrsType).toHaveClass('text-primary-400', 'bg-primary-400/10')
    expect(localgaapType).toHaveClass('text-accent-400', 'bg-accent-400/10')
  })

  it('displays break dates correctly', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('12/31/2024')).toBeInTheDocument()
    })

    expect(screen.getByText('9/30/2024')).toBeInTheDocument()
    expect(screen.getByText('12 months')).toBeInTheDocument()
    expect(screen.getByText('6 months')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockApiClient.getReports.mockRejectedValue(new Error('API Error'))
    mockApiClient.getTemplates.mockRejectedValue(new Error('API Error'))

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })

    // Should handle error gracefully and not crash
    expect(consoleError).toHaveBeenCalledWith('Failed to load data:', expect.any(Error))
    
    consoleError.mockRestore()
  })

  it('shows refresh loading state', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })

    // Mock a slow refresh
    mockApiClient.getReports.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve(mockReports), 100)
    ))

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshButton)

    // Should show spinning icon (refresh icon should have animate-spin class)
    const refreshIcon = refreshButton.querySelector('svg')
    expect(refreshIcon).toHaveClass('animate-spin')
  })

  it('has proper table headers', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Template')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Break Date')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
  })
})