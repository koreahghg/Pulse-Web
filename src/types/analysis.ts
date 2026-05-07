import type { AuditStrategy } from './common';

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AnalysisRequest {
  id: string;
  url: string;
  strategy: AuditStrategy;
  label?: string;
  requestedAt: string;
  status: AnalysisStatus;
}

export interface AnalysisError {
  code: string;
  message: string;
}

export interface AuditTarget {
  id: string;
  url: string;
  label: string;
  createdAt: string;
}
