import type { LighthouseReport } from '@/types';

const STORAGE_KEY = 'pulse-web:history';
const MAX_ENTRIES = 50;

interface StorageEntry {
  report: LighthouseReport;
  savedAt: string;
}

type StorageMap = Record<string, StorageEntry>;

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

export function getStoredReport(url: string): LighthouseReport | null {
  return readMap()[url]?.report ?? null;
}

export function saveReport(url: string, report: LighthouseReport): void {
  const map = readMap();
  const keys = Object.keys(map);
  if (keys.length >= MAX_ENTRIES && !(url in map)) {
    const oldest = keys.reduce((a, b) =>
      new Date(map[a].savedAt) <= new Date(map[b].savedAt) ? a : b
    );
    delete map[oldest];
  }
  map[url] = { report, savedAt: new Date().toISOString() };
  writeMap(map);
}
