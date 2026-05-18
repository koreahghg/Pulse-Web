import type { LighthouseReport } from '@/types';
import type { PRAnalysisSession } from '@/types/github';

const STORAGE_KEY = 'pulse-web:history';
const HISTORY_LIST_KEY = 'pulse-web:history-list';
const PR_SESSIONS_KEY = 'pulse-web:pr-sessions';
const MAX_ENTRIES = 50;
const MAX_PR_SESSIONS = 20;

interface StorageEntry {
  report: LighthouseReport;
  savedAt: string;
}

type StorageMap = Record<string, StorageEntry>;

export interface HistoryEntry {
  id: string;
  url: string;
  savedAt: string;
  report: LighthouseReport;
}

function readMap(): StorageMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StorageMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: StorageMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // 용량 초과 또는 시크릿 모드에서 무시
  }
}

function readHistoryList(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_LIST_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeHistoryList(list: HistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_LIST_KEY, JSON.stringify(list));
  } catch {
    // 용량 초과 또는 시크릿 모드에서 무시
  }
}

export function getStoredReport(url: string): LighthouseReport | null {
  return readMap()[url]?.report ?? null;
}

export function saveReport(url: string, report: LighthouseReport): void {
  const savedAt = new Date().toISOString();

  // URL별 최신 리포트 (비교 기능용)
  const map = readMap();
  const keys = Object.keys(map);
  if (keys.length >= MAX_ENTRIES && !(url in map)) {
    const oldest = keys.reduce((a, b) => (map[a].savedAt <= map[b].savedAt ? a : b));
    delete map[oldest];
  }
  map[url] = { report, savedAt };
  writeMap(map);

  // 전체 이력 리스트 (모든 실행 기록, 최신순)
  const list = readHistoryList();
  list.unshift({ id: report.id, url, savedAt, report });
  if (list.length > MAX_ENTRIES) list.splice(MAX_ENTRIES);
  writeHistoryList(list);
}

export function getAllHistoryEntries(): HistoryEntry[] {
  return readHistoryList();
}

export function deleteHistoryEntry(id: string): void {
  const list = readHistoryList().filter((entry) => entry.id !== id);
  writeHistoryList(list);
}

function readPRSessions(): PRAnalysisSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PR_SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as PRAnalysisSession[]) : [];
  } catch {
    return [];
  }
}

function writePRSessions(sessions: PRAnalysisSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PR_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // 용량 초과 또는 시크릿 모드에서 무시
  }
}

export function savePRSession(session: PRAnalysisSession): void {
  const sessions = readPRSessions().filter((s) => s.id !== session.id);
  sessions.unshift(session);
  if (sessions.length > MAX_PR_SESSIONS) sessions.splice(MAX_PR_SESSIONS);
  writePRSessions(sessions);
}

export function getAllPRSessions(): PRAnalysisSession[] {
  return readPRSessions();
}

export function deletePRSession(id: string): void {
  writePRSessions(readPRSessions().filter((s) => s.id !== id));
}
