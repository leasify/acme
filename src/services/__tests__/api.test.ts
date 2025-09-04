import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiClient, ApiError } from '../api'
import type { LoginRequest, CreateReportRequest } from '../../types/api'

const mockFetch = vi.mocked(fetch)

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('login', () => {
    it('should successfully login and store token', async () => {
      const mockResponse = {
        token: 'test-token-123',
        user: {
          id: 1,
          email: 'test@acme.com',
          name: 'Test User',
          company: { id: 1, name: 'ACME Corp' }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Map()
      } as Response)

      // Mock the whoami call that happens after successful login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse.user),
        headers: new Map()
      } as Response)

      const credentials: LoginRequest = {
        email: 'test@acme.com',
        password: 'password123',
        device_name: 'Test Device'
      }

      const result = await apiClient.login(credentials)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.leasify.se/api/v3/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(credentials)
        })
      )

      expect(result).toEqual(mockResponse)
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token-123')
    })

    it('should throw ApiError on login failure', async () => {
      const errorResponse = {
        message: 'Invalid credentials',
        errors: { email: ['Email is required'] }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve(errorResponse),
        headers: new Map()
      } as Response)

      await expect(
        apiClient.login({
          email: 'wrong@email.com',
          password: 'wrongpassword',
          device_name: 'Test Device'
        })
      ).rejects.toThrow(ApiError)
    })

    it('should provide user-friendly error message for 403 Forbidden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({}),
        headers: new Map()
      } as Response)

      try {
        await apiClient.login({
          email: 'test@email.com',
          password: 'password',
          device_name: 'Test Device'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toBe('Login failed. Your account may not be enabled for the API beta program. Please contact support for access.')
      }
    })

    it('should provide user-friendly error message for 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({}),
        headers: new Map()
      } as Response)

      try {
        await apiClient.login({
          email: 'test@email.com',
          password: 'wrongpassword',
          device_name: 'Test Device'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toBe('Login failed. Please check your email and password.')
      }
    })

    it('should provide user-friendly error message for 429 Too Many Requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({}),
        headers: new Map()
      } as Response)

      try {
        await apiClient.login({
          email: 'test@email.com',
          password: 'password',
          device_name: 'Test Device'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toBe('Too many login attempts. Please wait a moment before trying again.')
      }
    })

    it('should provide user-friendly error message for 500 Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
        headers: new Map()
      } as Response)

      try {
        await apiClient.login({
          email: 'test@email.com',
          password: 'password',
          device_name: 'Test Device'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toBe('Server error. Please try again later.')
      }
    })

    it('should use server message when available', async () => {
      const serverMessage = 'Custom server error message'
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ message: serverMessage }),
        headers: new Map()
      } as Response)

      try {
        await apiClient.login({
          email: 'test@email.com',
          password: 'password',
          device_name: 'Test Device'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toBe(serverMessage)
      }
    })
  })

  describe('whoami', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'test-token-123')
    })

    it('should return user information with valid token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@acme.com',
        name: 'Test User',
        company: { id: 1, name: 'ACME Corp' }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
        headers: new Map()
      } as Response)

      const result = await apiClient.whoami()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.leasify.se/api/v3/whoami',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123'
          })
        })
      )

      expect(result).toEqual(mockUser)
    })
  })

  describe('getTemplates', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'test-token-123')
    })

    it('should return list of templates', async () => {
      const mockTemplates = [
        {
          id: 1,
          name: 'IFRS 16 Template',
          generator_template: false,
          children: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplates),
        headers: new Map()
      } as Response)

      const result = await apiClient.getTemplates()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.leasify.se/api/v3/templates',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123'
          })
        })
      )

      expect(result).toEqual(mockTemplates)
    })
  })

  describe('getReports', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'test-token-123')
    })

    it('should return list of reports', async () => {
      const mockReports = [
        {
          id: 1,
          name: 'Q4 2024 Report',
          type: 'IFRS16',
          template_id: 1,
          template: { id: 1, name: 'IFRS 16 Template' },
          break_at: '2024-12-31',
          months: 12,
          status: 'finished',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReports),
        headers: new Map()
      } as Response)

      const result = await apiClient.getReports()

      expect(result).toEqual(mockReports)
    })
  })

  describe('createReport', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'test-token-123')
    })

    it('should create a new report successfully', async () => {
      const reportData: CreateReportRequest = {
        name: 'New Report',
        type: 'IFRS16',
        template_id: 1,
        break_at: '2024-12-31',
        months: 12
      }

      const mockCreatedReport = {
        id: 2,
        ...reportData,
        template: { id: 1, name: 'IFRS 16 Template' },
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCreatedReport),
        headers: new Map()
      } as Response)

      const result = await apiClient.createReport(reportData)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.leasify.se/api/v3/report',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token-123'
          }),
          body: JSON.stringify(reportData)
        })
      )

      expect(result).toEqual(mockCreatedReport)
    })

    it('should handle validation errors', async () => {
      const errorResponse = {
        message: 'Validation failed',
        errors: {
          name: ['Name is required'],
          template_id: ['Template is required']
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve(errorResponse),
        headers: new Map()
      } as Response)

      const invalidReportData: CreateReportRequest = {
        name: '',
        type: 'IFRS16',
        template_id: 0,
        break_at: '2024-12-31',
        months: 12
      }

      await expect(
        apiClient.createReport(invalidReportData)
      ).rejects.toThrow(ApiError)
    })
  })

  describe('logout', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'test-token-123')
    })

    it('should clear token from localStorage', () => {
      apiClient.logout()

      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('isAuthenticated', () => {
    it('should return false when no token exists', () => {
      expect(apiClient.isAuthenticated()).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.ping()).rejects.toThrow('Network error')
    })

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
        headers: new Map()
      } as Response)

      await expect(apiClient.ping()).rejects.toThrow(ApiError)
    })
  })
})

describe('ApiError', () => {
  it('should create error with status and message', () => {
    const error = new ApiError(404, 'Not found')
    
    expect(error.status).toBe(404)
    expect(error.message).toBe('Not found')
    expect(error.name).toBe('ApiError')
  })

  it('should create error with validation errors', () => {
    const errors = { email: ['Email is required'] }
    const error = new ApiError(422, 'Validation failed', errors)
    
    expect(error.errors).toEqual(errors)
  })
})