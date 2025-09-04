import React, { useState, useEffect } from 'react';
import JsonView from '@uiw/react-json-view';
import { Modal } from './ui/Modal';
import { Report } from '../types/api';
import { apiClient } from '../services/api';

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
}

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  const [fullReportData, setFullReportData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && report) {
      fetchFullReportData();
    }
  }, [isOpen, report]);

  const fetchFullReportData = async () => {
    if (!report) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching full report data for ID:', report.id);
      const reportData = await apiClient.getReport(report.id);
      console.log('Fetched full report data:', reportData);
      setFullReportData(reportData);
    } catch (err) {
      console.error('Failed to fetch full report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch report details');
      // Fallback to using the listing data
      setFullReportData(report);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setError(null);
    setFullReportData(null);
  };

  if (!isOpen || !report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={report ? `Report Details - ${report.name}` : 'Report Details'}
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Error State */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 font-medium">Error displaying report details</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Report Content */}
        <>
            {/* Report Summary */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">ID:</span>
              <span className="text-white ml-2">{report.id}</span>
            </div>
            <div>
              <span className="text-gray-400">Type:</span>
              <span className="text-white ml-2">{report.type}</span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                report.status === 'finished' ? 'bg-green-400/10 text-green-400' :
                report.status === 'processing' ? 'bg-yellow-400/10 text-yellow-400' :
                report.status === 'pending' ? 'bg-blue-400/10 text-blue-400' :
                'bg-red-400/10 text-red-400'
              }`}>
                {report.status}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Template:</span>
              <span className="text-white ml-2">{report.template?.name || `Template ${report.template_id}`}</span>
            </div>
            <div>
              <span className="text-gray-400">Break Date:</span>
              <span className="text-white ml-2">{new Date(report.break_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-400">Duration:</span>
              <span className="text-white ml-2">{report.months} months</span>
            </div>
            {report.years && (
              <div>
                <span className="text-gray-400">Years:</span>
                <span className="text-white ml-2">{report.years} years</span>
              </div>
            )}
            {report.language && (
              <div>
                <span className="text-gray-400">Language:</span>
                <span className="text-white ml-2">{report.language}</span>
              </div>
            )}
            <div>
              <span className="text-gray-400">Created:</span>
              <span className="text-white ml-2">{new Date(report.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-400">Updated:</span>
              <span className="text-white ml-2">{new Date(report.updated_at).toLocaleString()}</span>
            </div>
            {report.linked_report_id && (
              <div>
                <span className="text-gray-400">Linked Report:</span>
                <span className="text-white ml-2">{report.linked_report_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* JSON Data */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-3">JSON Data (Expandable)</h3>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 overflow-auto max-h-96">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                <span className="ml-3 text-gray-400 text-sm">Loading full report data...</span>
              </div>
            ) : fullReportData ? (
              <div 
                className="json-viewer-dark"
                style={{
                  '--w-rjv-color': '#e5e7eb',
                  '--w-rjv-key-string': '#60a5fa',
                  '--w-rjv-background-color': 'transparent',
                  '--w-rjv-line-color': '#374151',
                  '--w-rjv-arrow-color': '#9ca3af',
                  '--w-rjv-edit-color': '#fbbf24',
                  '--w-rjv-info-color': '#6b7280',
                  '--w-rjv-error-color': '#ef4444',
                  '--w-rjv-type-string-color': '#34d399',
                  '--w-rjv-type-int-color': '#fbbf24',
                  '--w-rjv-type-float-color': '#fbbf24',
                  '--w-rjv-type-bigint-color': '#fbbf24',
                  '--w-rjv-type-boolean-color': '#a78bfa',
                  '--w-rjv-type-date-color': '#fb7185',
                  '--w-rjv-type-undefined-color': '#6b7280',
                  '--w-rjv-type-null-color': '#6b7280',
                } as React.CSSProperties}
              >
                <JsonView 
                  value={fullReportData}
                  collapsed={2}
                  displayDataTypes={false}
                  enableClipboard={false}
                  style={{
                    backgroundColor: 'transparent',
                    fontSize: '13px',
                  }}
                />
              </div>
            ) : (
              <div className="text-gray-400 text-sm text-center py-8">
                No report data available
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <button
            onClick={() => {
              const dataToCopy = fullReportData || report;
              navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
            }}
            disabled={!fullReportData && !report}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-md text-sm transition-colors"
          >
            Copy JSON
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm transition-colors"
          >
            Close
          </button>
        </div>
        </>
      </div>
    </Modal>
  );
};