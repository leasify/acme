import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthProvider } from '../contexts/AuthContext'

// Mock the entire api module first
vi.mock('../services/api', () => ({
  apiClient: {
    login: vi.fn(),
    whoami: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn(),
    getReports: vi.fn(),
    getTemplates: vi.fn(),
    createReport: vi.fn(),
    getReport: vi.fn(),
    ping: vi.fn()
  },
  ApiError: class extends Error {
    constructor(public status: number, message: string, public errors?: Record<string, string[]>) {
      super(message)
      this.name = 'ApiError'
    }
  }
}))

// Get the mock after mocking
const { apiClient: mockApiClient } = await import('../services/api')
export { mockApiClient }

// Helper to render components with auth context
export const renderWithAuth = (ui: React.ReactElement, options = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(AuthProvider, null, children)
  }
  
  return render(ui, { wrapper: Wrapper, ...options })
}

// Reset all mocks
export const resetMocks = () => {
  if (mockApiClient) {
    Object.values(mockApiClient).forEach(mock => {
      if (typeof mock === 'function') {
        mock.mockReset()
      }
    })
  }
}