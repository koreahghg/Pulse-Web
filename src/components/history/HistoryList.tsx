'use client';

import type { HistoryEntry } from '@/types';
import { formatDate, formatScore, scoreToRating } from '@/lib/utils';

interface HistoryListProps {
  entries: HistoryEntry[];
  selectedId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

function ScoreBadge({ score }: { score: number }) {
  const value = formatScore(score);
  const rating = scoreToRating(score);
  const color =
    rating === 'good'
      ? 'bg-emerald-100 text-emerald-700'
      : rating === 'needs-improvement'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-rose-100 text-rose-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
      {value}
    </span>
  );
}

export function HistoryList({ entries, selectedId, onSelect, onDelete }: HistoryListProps) {
  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {entries.map((entry) => {
        const isSelected = entry.id === selectedId;
        return (
          <li key={entry.id}>
            <button
              onClick={() => onSelect(entry)}
              className={`group w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`min-w-0 flex-1 truncate text-sm font-medium ${
                    isSelected
                      ? 'text-blue-700'
                      : 'text-[var(--color-text-primary)]'
                  }`}
                >
                  {entry.url}
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ScoreBadge score={entry.report.categories.performance.score} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(entry.id);
                    }}
                    className="hidden rounded p-0.5 text-[var(--color-text-muted)] transition hover:bg-gray-200 hover:text-rose-600 group-hover:inline-flex"
                    aria-label="기록 삭제"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="size-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {formatDate(entry.savedAt)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
