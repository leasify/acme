export interface LoginRequest {
  email: string;
  password: string;
  device_name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  name: string;
  company: string; // Company name as string, not object
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  name: string;
}

export interface Template {
  id: number;
  name: string;
  generator_template: boolean;
  children: Template[];
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  name: string;
  type: 'IFRS16' | 'LOCALGAAP' | 'RKRR5' | 'GENERATOR';
  template_id: number;
  template: Template;
  break_at: string;
  months: number;
  years?: number;
  language?: string;
  linked_report_id?: number;
  parent_id?: number;
  status: 'pending' | 'processing' | 'finished' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface CreateReportRequest {
  name: string;
  type: 'IFRS16' | 'LOCALGAAP' | 'RKRR5' | 'GENERATOR';
  template_id: number;
  break_at: string;
  months: number;
  linked_report_id?: number;
  years?: number;
  language?: string;
  linked_reports?: string[];
  webhook?: string;
}