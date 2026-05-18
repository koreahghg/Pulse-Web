'use client';

import { useState } from 'react';

interface PRInputFormProps {
  onSubmit: (prUrl: string) => void;
  isLoading: boolean;
}

const PR_URL_PATTERN = /github\.com\/[^/]+\/[^/]+\/pull\/\d+/;

export function PRInputForm({ onSubmit, isLoading }: PRInputFormProps) {
  const [prUrl, setPrUrl] = useState('');

  const isValid = PR_URL_PATTERN.test(prUrl.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) onSubmit(prUrl.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="pr-url"
          className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
        >
          GitHub PR URL
        </label>
        <input
          id="pr-url"
          type="url"
          value={prUrl}
          onChange={(e) => setPrUrl(e.target.value)}
          placeholder="https://github.com/owner/repo/pull/123"
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          disabled={isLoading}
        />
        {prUrl && !isValid && (
          <p className="mt-1 text-xs text-red-500">
            올바른 GitHub PR URL 형식이 아닙니다. (예: https://github.com/owner/repo/pull/123)
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'PR 정보 가져오는 중...' : 'PR 정보 가져오기'}
      </button>
    </form>
  );
}
