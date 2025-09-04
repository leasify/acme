import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import * as apiModule from '../../services/api'

// Mock the API client
vi.mock('../../services/api', () => ({
  apiClient: {
    login: vi.fn(),
    whoami: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn()
  }
}))

const mockApiClient = vi.mocked(apiModule.apiClient)

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading, login, logout, isAuthenticated } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user">{user ? user.name : 'No User'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })

  it('should initialize with default values', async () => {
    mockApiClient.isAuthenticated.mockReturnValue(false)
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('No User')
  })

  it('should initialize with existing authenticated user', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      company: { id: 1, name: 'Test Company' }
    }

    mockApiClient.isAuthenticated.mockReturnValue(true)
    mockApiClient.whoami.mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('Test User')
  })

  it('should handle authentication failure during initialization', async () => {
    mockApiClient.isAuthenticated.mockReturnValue(true)
    mockApiClient.whoami.mockRejectedValue(new Error('Token expired'))
    mockApiClient.logout.mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    expect(mockApiClient.logout).toHaveBeenCalled()
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('No User')
  })

  it('should handle successful login', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      company: { id: 1, name: 'Test Company' }
    }

    const mockLoginResponse = {
      token: 'mock-token',
      user: mockUser
    }

    mockApiClient.isAuthenticated.mockReturnValue(false)
    mockApiClient.login.mockResolvedValue(mockLoginResponse)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    const loginButton = screen.getByText('Login')
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    expect(mockApiClient.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      device_name: 'ACME Demo App'
    })
  })

  it('should handle login failure', async () => {
    mockApiClient.isAuthenticated.mockReturnValue(false)
    mockApiClient.login.mockRejectedValue(new Error('Invalid credentials'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    const loginButton = screen.getByText('Login')
    
    // The login should throw an error, so we need to handle it
    await expect(async () => {
      fireEvent.click(loginButton)
      await waitFor(() => {
        // Wait for the async operation to complete
        expect(mockApiClient.login).toHaveBeenCalled()
      })
    }).rejects.toThrow('Invalid credentials')

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('No User')
  })

  it('should handle logout', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      company: { id: 1, name: 'Test Company' }
    }

    mockApiClient.isAuthenticated.mockReturnValue(true)
    mockApiClient.whoami.mockResolvedValue(mockUser)
    mockApiClient.logout.mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)

    expect(mockApiClient.logout).toHaveBeenCalled()
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('No User')
  })

  it('should maintain loading state correctly', async () => {
    mockApiClient.isAuthenticated.mockReturnValue(true)
    mockApiClient.whoami.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      company: { id: 1, name: 'Test Company' }
    }), 100)))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')

    // After initialization, should not be loading
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })
  })

  it('should update isAuthenticated based on user state', async () => {
    mockApiClient.isAuthenticated.mockReturnValue(false)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    // Initially not authenticated
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')

    // Mock successful login
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      company: { id: 1, name: 'Test Company' }
    }

    mockApiClient.login.mockResolvedValue({
      token: 'mock-token',
      user: mockUser
    })

    const loginButton = screen.getByText('Login')
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    })

    // Now logout
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
  })
})