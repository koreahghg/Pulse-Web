'use client';

import { useState } from 'react';
import type { GitHubPR } from '@/types';
import { isValidUrl } from '@/lib/utils';
import { PRInfoCard } from './PRInfoCard';

interface PRAnalysisConfigProps {
  pr: GitHubPR;
  onSubmit: (previewUrl: string, baselineUrl: string) => void;
  onBack: () => void;
}

export function PRAnalysisConfig({ pr, onSubmit, onBack }: PRAnalysisConfigProps) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [baselineUrl, setBaselineUrl] = useState('');

  const canSubmit = isValidUrl(previewUrl.trim()) && isValidUrl(baselineUrl.trim());

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (canSubmit) onSubmit(previewUrl.trim(), baselineUrl.trim());
  }

  return (
    <div className="space-y-4">
      <PRInfoCard pr={pr} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            PR 프리뷰 URL
            <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">
              (분석 대상)
            </span>
          </label>
          <input
            type="url"
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            placeholder="https://my-pr-preview.vercel.app"
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            베이스라인 URL
            <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">
              (비교 기준, 프로덕션)
            </span>
          </label>
          <input
            type="url"
            value={baselineUrl}
            onChange={(e) => setBaselineUrl(e.target.value)}
            placeholder="https://your-production-site.com"
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            저장된 이력이 있으면 재사용하여 API 요청을 절약합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-gray-50"
          >
            이전
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            분석 시작
          </button>
        </div>
      </form>
    </div>
  );
}
