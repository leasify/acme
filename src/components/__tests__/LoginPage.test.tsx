import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '../LoginPage'
import { AuthProvider } from '../../contexts/AuthContext'
import { ApiError } from '../../services/api'
import * as apiModule from '../../services/api'

// Mock the API client
vi.mock('../../services/api', () => ({
  apiClient: {
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn()
  },
  ApiError: class extends Error {
    constructor(public status: number, message: string, public errors?: Record<string, string[]>) {
      super(message)
      this.name = 'ApiError'
    }
  }
}))

const mockApiClient = vi.mocked(apiModule.apiClient)

// Wrapper component to provide auth context
const LoginPageWrapper = () => (
  <AuthProvider>
    <LoginPage />
  </AuthProvider>
)

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockApiClient.isAuthenticated.mockReturnValue(false)
  })

  it('renders login form with all elements', async () => {
    render(<LoginPageWrapper />)

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Check branding elements
    expect(screen.getByText('ACME')).toBeInTheDocument()
    expect(screen.getByText('Report Management')).toBeInTheDocument()
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('IFRS Reporting')).toBeInTheDocument()

    // Check form elements
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()

    // Check features
    expect(screen.getByText('Secure')).toBeInTheDocument()
    expect(screen.getByText('Compliant')).toBeInTheDocument()
    expect(screen.getByText('Efficient')).toBeInTheDocument()
  })

  it('displays form validation for required fields', async () => {
    const user = userEvent.setup()
    render(<LoginPageWrapper />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    
    // Try to submit empty form
    await user.click(submitButton)

    // HTML5 validation should prevent submission - check that inputs are required
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    const mockUser = {
      id: 1,
      email: 'test@acme.com',
      name: 'Test User',
      company: { id: 1, name: 'ACME Corp' }
    }

    mockApiClient.login.mockResolvedValue({
      token: 'test-token',
      user: mockUser
    })

    render(<LoginPageWrapper />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Fill in the form
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(emailInput, 'test@acme.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Check that login was called with correct data
    await waitFor(() => {
      expect(mockApiClient.login).toHaveBeenCalledWith({
        email: 'test@acme.com',
        password: 'password123',
        device_name: 'ACME Demo App'
      })
    })

    // Should show loading state during login
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
  })

  it('handles login failure with error message', async () => {
    const user = userEvent.setup()
    
    mockApiClient.login.mockRejectedValue(new ApiError(401, 'Invalid credentials'))

    render(<LoginPageWrapper />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Fill in the form
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(emailInput, 'wrong@email.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    // Button should return to normal state
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('handles generic error during login', async () => {
    const user = userEvent.setup()
    
    mockApiClient.login.mockRejectedValue(new Error('Network error'))

    render(<LoginPageWrapper />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
    })
  })

  it('disables submit button during login', async () => {
    const user = userEvent.setup()
    
    // Create a promise that we can control
    let resolveLogin: (value: any) => void
    mockApiClient.login.mockReturnValue(new Promise(resolve => {
      resolveLogin = resolve
    }))

    render(<LoginPageWrapper />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password')
    await user.click(submitButton)

    // Button should be disabled and show loading text
    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()
    
    // Resolve the login promise
    resolveLogin!({
      token: 'test-token',
      user: { id: 1, email: 'test@example.com', name: 'Test User', company: { id: 1, name: 'Test Company' } }
    })
  })

  it('updates form fields correctly', async () => {
    const user = userEvent.setup()
    render(<LoginPageWrapper />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'mypassword')

    expect(emailInput.value).toBe('user@example.com')
    expect(passwordInput.value).toBe('mypassword')
  })

  it('clears error message when starting new login attempt', async () => {
    const user = userEvent.setup()
    
    // First login fails
    mockApiClient.login.mockRejectedValueOnce(new ApiError(401, 'Invalid credentials'))

    render(<LoginPageWrapper />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(emailInput, 'wrong@email.com')
    await user.type(passwordInput, 'wrong')
    await user.click(submitButton)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    // Clear and try again with successful login
    await user.clear(emailInput)
    await user.clear(passwordInput)
    
    mockApiClient.login.mockResolvedValueOnce({
      token: 'test-token',
      user: { id: 1, email: 'test@example.com', name: 'Test User', company: { id: 1, name: 'Test Company' } }
    })

    await user.type(emailInput, 'correct@email.com')
    await user.type(passwordInput, 'correct')
    await user.click(submitButton)

    // Error should be cleared when starting new login
    await waitFor(() => {
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
    })
  })

  it('has proper accessibility attributes', async () => {
    render(<LoginPageWrapper />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(emailInput).toHaveAttribute('placeholder', 'Enter your email')
    expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password')
  })
})