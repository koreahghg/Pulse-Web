'use client';

import { useState, useCallback } from 'react';
import type { GitHubPR, PRAnalysisStep, PRAnalysisSession } from '@/types/github';
import type { LighthouseReport } from '@/types';
import type { ComparisonResult } from '@/types/comparison';
import { fetchGitHubPR } from '@/services/github';
import { requestLighthouseAudit } from '@/services/audit';
import { getStoredReport, saveReport, savePRSession } from '@/lib/storage';
import { calculateComparison } from '@/lib/comparison';

interface PRAnalysisState {
  step: PRAnalysisStep;
  pr: GitHubPR | null;
  previewReport: LighthouseReport | null;
  baselineReport: LighthouseReport | null;
  comparison: ComparisonResult | null;
  error: string | null;
}

const INITIAL_STATE: PRAnalysisState = {
  step: 'input',
  pr: null,
  previewReport: null,
  baselineReport: null,
  comparison: null,
  error: null,
};

export function usePRAnalysis() {
  const [state, setState] = useState<PRAnalysisState>(INITIAL_STATE);

  const fetchPR = useCallback(async (prUrl: string) => {
    setState((prev) => ({ ...prev, step: 'fetching-pr', error: null }));
    try {
      const pr = await fetchGitHubPR(prUrl);
      setState((prev) => ({ ...prev, step: 'configuring', pr }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: err instanceof Error ? err.message : 'PR 정보를 가져오는 중 오류가 발생했습니다.',
      }));
    }
  }, []);

  const runAnalysis = useCallback(async (previewUrl: string, baselineUrl: string) => {
    const currentPR = state.pr;
    if (!currentPR) return;

    setState((prev) => ({ ...prev, step: 'analyzing-preview', error: null }));

    try {
      const previewReport = await requestLighthouseAudit(previewUrl);
      saveReport(previewUrl, previewReport);

      setState((prev) => ({ ...prev, step: 'analyzing-baseline', previewReport }));

      let baselineReport = getStoredReport(baselineUrl);
      if (!baselineReport) {
        baselineReport = await requestLighthouseAudit(baselineUrl);
        saveReport(baselineUrl, baselineReport);
      }

      const comparison = calculateComparison(baselineReport, previewReport);

      const session: PRAnalysisSession = {
        id: `${currentPR.repository.fullName}#${currentPR.number}-${Date.now()}`,
        pr: currentPR,
        previewUrl,
        baselineUrl,
        previewReport,
        baselineReport,
        analyzedAt: new Date().toISOString(),
      };
      savePRSession(session);

      setState((prev) => ({
        ...prev,
        step: 'complete',
        baselineReport,
        comparison,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.',
      }));
    }
  }, [state.pr]);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const backToInput = useCallback(() => setState(INITIAL_STATE), []);

  return { ...state, fetchPR, runAnalysis, reset, backToInput };
}
