import React, { useState } from 'react';
import { FileText, Clock } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { apiClient, ApiError } from '../services/api';
import { Template, Report, CreateReportRequest } from '../types/api';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  onSuccess: (report: Report) => void;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'IFRS16' as const,
    template_id: '',
    break_at: '',
    months: '12',
    years: '',
    language: '',
    webhook: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reportTypes = [
    { value: 'IFRS16', label: 'IFRS 16' },
    { value: 'LOCALGAAP', label: 'Local GAAP' },
    { value: 'RKRR5', label: 'RKR R5' },
    { value: 'GENERATOR', label: 'Generator' }
  ];

  const templateOptions = [
    { value: '', label: 'Select a template...' },
    ...templates.map(template => ({
      value: template.id.toString(),
      label: template.name
    }))
  ];

  const languageOptions = [
    { value: '', label: 'Default' },
    { value: 'en', label: 'English' },
    { value: 'sv', label: 'Swedish' },
    { value: 'no', label: 'Norwegian' },
    { value: 'da', label: 'Danish' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const requestData: CreateReportRequest = {
        name: formData.name,
        type: formData.type,
        template_id: parseInt(formData.template_id),
        break_at: formData.break_at,
        months: parseInt(formData.months),
        ...(formData.years && { years: parseInt(formData.years) }),
        ...(formData.language && { language: formData.language }),
        ...(formData.webhook && { webhook: formData.webhook })
      };

      const newReport = await apiClient.createReport(requestData);
      onSuccess(newReport);
      
      // Reset form
      setFormData({
        name: '',
        type: 'IFRS16',
        template_id: '',
        break_at: '',
        months: '12',
        years: '',
        language: '',
        webhook: ''
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.errors) {
          const firstError = Object.values(err.errors)[0];
          if (firstError && firstError.length > 0) {
            setError(firstError[0]);
          }
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError('');
      setFormData({
        name: '',
        type: 'IFRS16',
        template_id: '',
        break_at: '',
        months: '12',
        years: '',
        language: '',
        webhook: ''
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Report"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Name */}
        <Input
          label="Report Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter report name"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Report Type */}
          <Select
            label="Report Type"
            options={reportTypes}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            required
          />

          {/* Template */}
          <Select
            label="Template"
            options={templateOptions}
            value={formData.template_id}
            onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Break Date */}
          <Input
            label="Break Date"
            type="date"
            value={formData.break_at}
            onChange={(e) => setFormData({ ...formData, break_at: e.target.value })}
            required
          />

          {/* Months */}
          <Input
            label="Duration (Months)"
            type="number"
            min="1"
            max="120"
            value={formData.months}
            onChange={(e) => setFormData({ ...formData, months: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Years (Optional) */}
          <Input
            label="Years (Optional)"
            type="number"
            min="1"
            max="10"
            value={formData.years}
            onChange={(e) => setFormData({ ...formData, years: e.target.value })}
            placeholder="Leave empty for default"
          />

          {/* Language */}
          <Select
            label="Language"
            options={languageOptions}
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          />
        </div>

        {/* Webhook URL (Optional) */}
        <Input
          label="Webhook URL (Optional)"
          type="url"
          value={formData.webhook}
          onChange={(e) => setFormData({ ...formData, webhook: e.target.value })}
          placeholder="https://your-webhook-url.com"
        />

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-500 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-primary-900/20 border border-primary-500/30 rounded-md">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-primary-400 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="text-primary-300 font-medium">Report Creation Info</p>
              <ul className="text-gray-300 space-y-1">
                <li>• Reports are processed asynchronously and may take a few minutes to complete</li>
                <li>• You can track the progress in the reports table</li>
                <li>• Webhook notifications will be sent when processing is complete (if provided)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name || !formData.template_id}
            className="bg-accent-600 hover:bg-accent-700"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Create Report</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};