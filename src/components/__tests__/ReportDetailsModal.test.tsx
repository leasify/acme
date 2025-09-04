import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ReportDetailsModal } from '../ReportDetailsModal';
import { Report } from '../../types/api';

// Mock the entire api module
vi.mock('../../services/api', () => ({
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
}));

// Mock the JsonView component since it's complex to test
vi.mock('@uiw/react-json-view', () => ({
  default: ({ value }: { value: any }) => (
    <div data-testid="json-view">
      {JSON.stringify(value, null, 2)}
    </div>
  )
}));

const mockReport: Report = {
  id: 123,
  name: 'Test Report',
  type: 'IFRS16',
  template_id: 1,
  template: { id: 1, name: 'Test Template', generator_template: false, children: [], created_at: '2024-01-01', updated_at: '2024-01-01' },
  break_at: '2024-12-31',
  months: 12,
  status: 'finished',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z'
};

const mockFullReport: Report = {
  ...mockReport,
  years: 1,
  language: 'en',
  linked_report_id: 456
};

describe('ReportDetailsModal', () => {
  let mockApiClient: any;

  beforeEach(async () => {
    // Get the mocked apiClient after each test
    const apiModule = await import('../../services/api');
    mockApiClient = apiModule.apiClient;
    
    // Reset all mocks
    Object.values(mockApiClient).forEach(mock => {
      if (typeof mock === 'function') {
        mock.mockReset();
      }
    });

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders modal when open with report data', () => {
    render(
      <ReportDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    expect(screen.getByText('Report Details - Test Report')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('JSON Data (Expandable)')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ReportDetailsModal
        isOpen={false}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    expect(screen.queryByText('Report Details - Test Report')).not.toBeInTheDocument();
  });

  it('does not render when no report provided', () => {
    render(
      <ReportDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        report={null}
      />
    );

    expect(screen.queryByText('Report Details')).not.toBeInTheDocument();
  });

  it('displays summary information from listing data', () => {
    render(
      <ReportDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    expect(screen.getByText('123')).toBeInTheDocument(); // ID
    expect(screen.getByText('IFRS16')).toBeInTheDocument(); // Type
    expect(screen.getByText('finished')).toBeInTheDocument(); // Status
    expect(screen.getByText('Test Template')).toBeInTheDocument(); // Template
    expect(screen.getByText('12 months')).toBeInTheDocument(); // Duration
  });

  it('shows loading state while fetching API data', async () => {
    // Make the API call hang
    mockApiClient.getReport.mockImplementation(() => new Promise(() => {}));

    render(
      <ReportDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    expect(screen.getByText('Loading full report data...')).toBeInTheDocument();
    // Check for spinner element
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('fetches and displays full report data in JSON tree', async () => {
    mockApiClient.getReport.mockResolvedValue(mockFullReport);

    render(
      <ReportDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    await waitFor(() => {
      expect(mockApiClient.getReport).toHaveBeenCalledWith(123);
    });

    // Should display the JSON view with full data
    expect(screen.getByTestId('json-view')).toBeInTheDocument();
    expect(screen.getByTestId('json-view')).toHaveTextContent('years');
    expect(screen.getByTestId('json-view')).toHaveTextContent('language');
  });

  it('handles API error gracefully and falls back to listing data', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockApiClient.getReport.mockRejectedValue(new Error('API Error'));

    render(
      <ReportDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    await waitFor(() => {
      expect(mockApiClient.getReport).toHaveBeenCalledWith(123);
    });

    // Should show error message
    expect(screen.getByText('Error displaying report details')).toBeInTheDocument();
    expect(screen.getByText('API Error')).toBeInTheDocument();

    // Should still show JSON view with fallback data
    expect(screen.getByTestId('json-view')).toBeInTheDocument();
    expect(screen.getByTestId('json-view')).toHaveTextContent('Test Report');

    consoleError.mockRestore();
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();

    render(
      <ReportDetailsModal
        isOpen={true}
        onClose={onCloseMock}
        report={mockReport}
      />
    );

    fireEvent.click(screen.getByText('Close'));
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('copies JSON data to clipboard with full data', async () => {
    mockApiClient.getReport.mockResolvedValue(mockFullReport);

    render(
      <ReportDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    await waitFor(() => {
      expect(mockApiClient.getReport).toHaveBeenCalledWith(123);
    });

    fireEvent.click(screen.getByText('Copy JSON'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(mockFullReport, null, 2)
    );
  });

  it('copies fallback data to clipboard when API fails', async () => {
    mockApiClient.getReport.mockRejectedValue(new Error('API Error'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ReportDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    await waitFor(() => {
      expect(mockApiClient.getReport).toHaveBeenCalledWith(123);
    });

    fireEvent.click(screen.getByText('Copy JSON'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(mockReport, null, 2)
    );

    consoleError.mockRestore();
  });

  it('re-fetches data when report changes', async () => {
    mockApiClient.getReport.mockResolvedValue(mockFullReport);

    const { rerender } = render(
      <ReportDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    await waitFor(() => {
      expect(mockApiClient.getReport).toHaveBeenCalledWith(123);
    });

    const newReport = { ...mockReport, id: 456, name: 'New Report' };
    rerender(
      <ReportDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        report={newReport}
      />
    );

    await waitFor(() => {
      expect(mockApiClient.getReport).toHaveBeenCalledWith(456);
    });

    expect(mockApiClient.getReport).toHaveBeenCalledTimes(2);
  });
});