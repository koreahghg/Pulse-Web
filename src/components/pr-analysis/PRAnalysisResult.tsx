'use client';

import type { GitHubPR } from '@/types/github';
import type { LighthouseReport } from '@/types';
import type { ComparisonResult } from '@/types/comparison';
import { PRInfoCard } from './PRInfoCard';
import { ComparisonTable } from '@/components/comparison/ComparisonTable';
import { WebVitalsChart } from '@/components/charts/WebVitalsChart';
import { RecommendationPanel } from '@/components/recommendations/RecommendationPanel';
import { useRecommendations } from '@/hooks/useRecommendations';

interface PRAnalysisResultProps {
  pr: GitHubPR;
  previewReport: LighthouseReport;
  comparison: ComparisonResult;
  onReset: () => void;
}

export function PRAnalysisResult({
  pr,
  previewReport,
  comparison,
  onReset,
}: PRAnalysisResultProps) {
  const recommendations = useRecommendations(previewReport);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">분석 결과</h2>
        <button onClick={onReset} className="text-sm text-blue-600 hover:underline">
          새 PR 분석
        </button>
      </div>

      <PRInfoCard pr={pr} />

      <section>
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
          PR vs 프로덕션 비교
        </h3>
        <ComparisonTable comparison={comparison} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
          PR 프리뷰 Web Vitals
        </h3>
        <WebVitalsChart report={previewReport} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">개선 권고 사항</h3>
        <RecommendationPanel recommendations={recommendations} />
      </section>
    </div>
  );
}
