import type { AnalysisRequest, AnalysisError } from './analysis';
import type { LighthouseReport } from './lighthouse';

export type AnalysisRecord =
  | {
      request: AnalysisRequest & { status: 'completed' };
      result: LighthouseReport;
      error: null;
      completedAt: string;
      /** 요청 시작부터 완료까지 소요 시간 (ms) */
      durationMs: number;
    }
  | {
      request: AnalysisRequest & { status: 'failed' };
      result: null;
      error: AnalysisError;
      completedAt: string;
      durationMs: number;
    }
  | {
      request: AnalysisRequest & { status: 'pending' | 'running' };
      result: null;
      error: null;
      completedAt: null;
      durationMs: null;
    };

export interface AnalysisHistory {
  targetId: string;
  url: string;
  records: AnalysisRecord[];
  lastUpdatedAt: string;
}

/**
 * localStorage / IndexedDB 저장 루트 구조.
 * version 필드로 스키마 마이그레이션을 처리한다.
 */
export interface StoredHistory {
  version: number;
  /** URL 해시를 키로 사용 */
  entries: Record<string, AnalysisHistory>;
  createdAt: string;
  updatedAt: string;
}
