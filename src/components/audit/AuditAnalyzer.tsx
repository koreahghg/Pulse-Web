'use client';

import { useState } from 'react';
import { formatDate, formatScore, isValidUrl } from '@/lib/utils';
import { requestLighthouseAudit } from '@/services/audit';
import { WebVitalsChart } from '@/components/charts/WebVitalsChart';
import type { LighthouseReport } from '@/types';

type AuditState =
  | { status: 'idle'; report: null; message: null }
  | { status: 'loading'; report: null; message: null }
  | { status: 'success'; report: LighthouseReport; message: null }
  | { status: 'error'; report: null; message: string };

export function AuditAnalyzer() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<AuditState>({
    status: 'idle',
    report: null,
    message: null,
  });

  const isLoading = state.status === 'loading';

  async function handleSubmit(event: { preventDefault(): void }) {
    event.preventDefault();

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setState({ status: 'error', report: null, message: '분석할 URL을 입력해주세요.' });
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setState({
        status: 'error',
        report: null,
        message: 'http:// 또는 https:// 형식의 URL을 입력해주세요.',
      });
      return;
    }

    setState({ status: 'loading', report: null, message: null });

    try {
      const report = await requestLighthouseAudit(trimmedUrl);
      setState({ status: 'success', report, message: null });
    } catch (error) {
      setState({
        status: 'error',
        report: null,
        message:
          error instanceof Error
            ? error.message
            : '성능 분석 중 알 수 없는 오류가 발생했습니다.',
      });
    }
  }

  const report = state.status === 'success' ? state.report : null;
  const categories = report ? Object.values(report.categories) : [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">성능 감사</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            분석할 웹사이트 URL을 입력하면 Lighthouse API를 호출해 주요 성능 지표를 보여줍니다.
          </p>
        </div>

        <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <label className="flex-1">
            <span className="sr-only">분석할 URL</span>
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={isLoading}
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? '분석 중...' : '분석 시작'}
          </button>
        </form>

        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Google PageSpeed Insights API를 통해 모바일 Lighthouse 결과를 조회합니다.
        </p>
      </section>

      {state.status === 'loading' && (
        <section className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
          Lighthouse 분석을 진행 중입니다. 응답까지 수 초에서 수십 초 정도 걸릴 수 있습니다.
        </section>
      )}

      {state.status === 'error' && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {state.message}
        </section>
      )}

      {report ? (
        <>
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--color-text-muted)]">분석 대상</p>
                <p className="break-all text-lg font-semibold text-[var(--color-text-primary)]">
                  {report.url}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  분석 시각 {formatDate(report.fetchTime)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900 px-5 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Performance</p>
                <p className="mt-2 text-4xl font-bold">
                  {formatScore(report.categories.performance.score)}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <article
                key={category.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                  {category.title}
                </p>
                <p className="mt-3 text-3xl font-bold text-[var(--color-text-primary)]">
                  {formatScore(category.score)}
                </p>
              </article>
            ))}
          </section>

          <WebVitalsChart report={report} />
        </>
      ) : (
        state.status === 'idle' && (
          <section className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] py-20 text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              아직 분석 결과가 없습니다.
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              URL을 입력하고 분석을 시작하면 주요 Lighthouse 지표가 여기에 표시됩니다.
            </p>
          </section>
        )
      )}
    </div>
  );
}
