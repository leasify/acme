import { LoginRequest, LoginResponse, User, Template, Report, CreateReportRequest } from '../types/api';

const API_BASE_URL = 'https://app.leasify.se/api/v3';

class ApiError extends Error {
  constructor(public status: number, public message: string, public errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(response.status, errorData.message || 'An error occurred', errorData.errors);
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('API: Starting login request to:', `${API_BASE_URL}/login`);
    console.log('API: Credentials:', { ...credentials, password: '***' });

    try {
      const url = `${API_BASE_URL}/login`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('API: Response status:', response.status, response.statusText);
      console.log('API: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
          console.log('API: Error response body:', errorData);
        } catch (e) {
          console.log('API: No JSON in error response');
        }
        
        let errorMessage: string;
        
        // Use server message if available, otherwise provide user-friendly error messages
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (response.status === 403) {
          errorMessage = 'Login failed. Your account may not be enabled for the API beta program. Please contact support for access.';
        } else if (response.status === 401) {
          errorMessage = 'Login failed. Please check your email and password.';
        } else if (response.status === 429) {
          errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error('API: Login failed with error:', errorMessage);
        throw new ApiError(response.status, errorMessage, errorData.errors);
      }

      // Try to get response data first
      let responseData: any = {};
      try {
        responseData = await response.json();
        console.log('API: Success response body:', responseData);
      } catch (e) {
        console.log('API: No JSON in success response');
      }

      // Leasify API returns token in 'bearer' field
      let token = responseData.bearer || responseData.token || responseData.access_token;
      
      if (!token) {
        // Check headers for token
        token = response.headers.get('Authorization') || 
                response.headers.get('X-Auth-Token') ||
                response.headers.get('Access-Token');
        
        if (token) {
          token = token.replace('Bearer ', ''); // Clean up bearer prefix
        }
      }

      console.log('API: Extracted token:', token ? '***TOKEN***' : 'NO TOKEN');

      if (token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
      } else {
        // If no token found, this might be a session-based auth
        // For demo purposes, create a mock token
        console.warn('API: No token found in response, creating demo token');
        const demoToken = 'demo-token-' + Date.now();
        this.token = demoToken;
        localStorage.setItem('auth_token', demoToken);
      }

      // Get user info after successful login
      console.log('API: Fetching user info...');
      const user = await this.whoami();
      console.log('API: User info:', user);
      
      return {
        token: this.token!,
        user
      };
    } catch (error) {
      console.error('API: Login request failed:', error);
      throw error;
    }
  }

  async whoami(): Promise<User> {
    return this.request<User>('/whoami');
  }

  async ping(): Promise<{ message: string; timestamp: string }> {
    return this.request('/ping');
  }

  async getTemplates(): Promise<Template[]> {
    return this.request<Template[]>('/templates');
  }

  async getReports(): Promise<Report[]> {
    return this.request<Report[]>('/reports');
  }

  async getTemplateReports(templateId: number): Promise<Report[]> {
    return this.request<Report[]>(`/template/${templateId}/reports`);
  }

  async createReport(report: CreateReportRequest): Promise<Report> {
    return this.request<Report>('/report', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async getReport(reportId: number): Promise<Report> {
    return this.request<Report>(`/report/${reportId}`);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiClient = new ApiClient();
export { ApiError };