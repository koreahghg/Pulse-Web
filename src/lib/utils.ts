import type { MetricScore } from '@/types';

export function scoreToRating(score: number): MetricScore {
  if (score >= 0.9) return 'good';
  if (score >= 0.5) return 'needs-improvement';
  return 'poor';
}

export function formatScore(score: number): number {
  return Math.round(score * 100);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return !isPrivateHost(url.hostname);
  } catch {
    return false;
  }
}

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  const privatePatterns = [
    /^localhost$/,
    /^127\./,
    /^0\./,
    /^10\./,
    /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^198\.(1[89])\./,
    /^\[?::1\]?$/,
    /^\[?::ffff:127\./,
    /^\[?fe80:/,
    /^metadata\.google\.internal$/,
  ];
  return privatePatterns.some((pattern) => pattern.test(lower));
}

export interface ScoreStyle {
  text: string;
  bg: string;
  border: string;
}

export function getScoreStyle(score: number): ScoreStyle {
  const pct = Math.round(score * 100);
  if (pct >= 90) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  if (pct >= 50) return { text: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
}

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
