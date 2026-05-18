'use client';

import { usePRAnalysis } from '@/hooks/usePRAnalysis';
import { PRInputForm } from '@/components/pr-analysis/PRInputForm';
import { PRInfoCard } from '@/components/pr-analysis/PRInfoCard';
import { PRAnalysisConfig } from '@/components/pr-analysis/PRAnalysisConfig';
import { PRAnalysisResult } from '@/components/pr-analysis/PRAnalysisResult';
import type { PRAnalysisStep } from '@/types/github';

const STEP_INDEX: Record<PRAnalysisStep, number> = {
  input: 0,
  'fetching-pr': 0,
  configuring: 1,
  'analyzing-preview': 1,
  'analyzing-baseline': 1,
  complete: 2,
  error: 0,
};

const STEP_LABELS = ['PR 입력', 'URL 설정', '분석 완료'];

function ProgressSteps({ step }: { step: PRAnalysisStep }) {
  const current = STEP_INDEX[step];
  return (
    <div className="mb-6 flex items-center gap-2">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && (
            <div className={`h-px w-8 ${i <= current ? 'bg-blue-500' : 'bg-gray-200'}`} />
          )}
          <div className="flex items-center gap-1.5">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                i < current
                  ? 'bg-blue-600 text-white'
                  : i === current
                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span
              className={`text-xs ${
                i === current
                  ? 'font-medium text-blue-700'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyzingState({ step }: { step: PRAnalysisStep }) {
  const message =
    step === 'analyzing-preview' ? 'PR 프리뷰 URL 분석 중...' : '베이스라인 URL 분석 중...';
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{message}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        PageSpeed Insights API 호출 중입니다.
      </p>
    </div>
  );
}

export default function PRAnalysisPage() {
  const {
    step,
    pr,
    previewReport,
    baselineReport,
    comparison,
    error,
    fetchPR,
    runAnalysis,
    reset,
    backToInput,
  } = usePRAnalysis();

  const isAnalyzing = step === 'analyzing-preview' || step === 'analyzing-baseline';

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          GitHub PR 성능 분석
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          PR 프리뷰 URL을 분석하고 프로덕션 결과와 비교합니다.
        </p>
      </div>

      {step !== 'complete' && <ProgressSteps step={step} />}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={reset} className="ml-2 font-medium underline">
            다시 시도
          </button>
        </div>
      )}

      {(step === 'input' || step === 'fetching-pr') && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
          <PRInputForm onSubmit={fetchPR} isLoading={step === 'fetching-pr'} />
        </div>
      )}

      {step === 'configuring' && pr && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
          <PRAnalysisConfig pr={pr} onSubmit={runAnalysis} onBack={backToInput} />
        </div>
      )}

      {isAnalyzing && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6">
          {pr && <div className="mb-4"><PRInfoCard pr={pr} /></div>}
          <AnalyzingState step={step} />
        </div>
      )}

      {step === 'complete' &&
        pr &&
        previewReport &&
        baselineReport &&
        comparison && (
          <PRAnalysisResult
            pr={pr}
            previewReport={previewReport}
            comparison={comparison}
            onReset={reset}
          />
        )}
    </div>
  );
}
