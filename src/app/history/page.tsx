'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { HistoryEntry } from '@/types';
import { getAllHistoryEntries, deleteHistoryEntry } from '@/lib/storage';
import { HistoryList } from '@/components/history/HistoryList';
import { HistoryDetail } from '@/components/history/HistoryDetail';

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    setEntries(getAllHistoryEntries());
  }, []);

  function handleSelect(entry: HistoryEntry) {
    setSelectedEntry(entry);
  }

  function handleDelete(id: string) {
    deleteHistoryEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  }

  function handleClose() {
    setSelectedEntry(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">측정 이력</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          과거 성능 분석 기록을 확인하고 상세 결과를 조회합니다.
        </p>
      </div>

      {entries.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] py-24 text-center">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            저장된 분석 기록이 없습니다.
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            성능 감사 페이지에서 URL을 분석하면 여기에 자동으로 저장됩니다.
          </p>
          <Link
            href="/audit"
            className="mt-5 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            성능 감사 시작하기
          </Link>
        </section>
      ) : (
        <div className="lg:grid lg:grid-cols-[20rem_1fr] lg:items-start lg:gap-6">
          {/* 이력 목록 패널 */}
          <aside
            className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm overflow-hidden ${
              selectedEntry ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                분석 기록 ({entries.length})
              </p>
            </div>
            <HistoryList
              entries={entries}
              selectedId={selectedEntry?.id ?? null}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          </aside>

          {/* 상세 보기 패널 */}
          <div className={selectedEntry ? 'block' : 'hidden lg:block'}>
            {selectedEntry ? (
              <HistoryDetail entry={selectedEntry} onClose={handleClose} />
            ) : (
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] py-24 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">
                  목록에서 기록을 선택하면 상세 결과가 표시됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
