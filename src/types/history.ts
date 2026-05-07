import type { AnalysisRequest, AnalysisError } from './analysis';
import type { LighthouseReport } from './lighthouse';

export interface AnalysisRecord {
  request: AnalysisRequest;
  result: LighthouseReport | null;
  error: AnalysisError | null;
  completedAt: string | null;
  /** 요청 시작부터 완료까지 소요 시간 (ms) */
  durationMs: number | null;
}

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
