import type { LighthouseReport } from '@/types';
import type { MetricScore } from '@/types/common';
import type {
  Recommendation,
  RecommendationPriority,
  RecommendationImpact,
} from '@/types/recommendation';

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function scoreToMetricScore(score: number): MetricScore {
  if (score >= 0.9) return 'good';
  if (score >= 0.5) return 'needs-improvement';
  return 'poor';
}

function impactFromPriority(priority: RecommendationPriority): RecommendationImpact {
  return priority === 'low' ? 'low' : priority === 'medium' ? 'medium' : 'high';
}

export function generateRecommendations(report: LighthouseReport): Recommendation[] {
  const recs: Recommendation[] = [];
  const { categories, webVitals, keyMetrics } = report;

  // ── Performance: LCP ────────────────────────────────────────────────────────
  const lcpScore = webVitals?.lcp?.score ?? keyMetrics.lcp?.scoreLabel ?? (keyMetrics.lcp ? scoreToMetricScore(keyMetrics.lcp.score) : undefined);
  const lcpDisplay = webVitals?.lcp?.displayValue ?? keyMetrics.lcp?.displayValue;

  if (lcpScore && lcpScore !== 'good' && lcpDisplay) {
    const isPoor = lcpScore === 'poor';
    const priority: RecommendationPriority = isPoor ? 'critical' : 'high';
    recs.push({
      id: 'lcp',
      title: 'LCP(최대 콘텐츠 렌더링) 속도 개선',
      description: `현재 LCP: ${lcpDisplay}. ${isPoor ? '4초를 초과해 사용자 이탈 위험이 높습니다.' : '2.5초~4초 사이로 개선이 권장됩니다.'}`,
      priority,
      category: 'performance',
      impact: impactFromPriority(priority),
      metric: 'lcp',
      currentValue: lcpDisplay,
      actions: isPoor
        ? [
            {
              label: 'next/image 컴포넌트 적용',
              detail: 'Next.js Image 컴포넌트로 교체해 자동 WebP 변환·lazy load·크기 최적화를 적용합니다.',
            },
            {
              label: 'LCP 이미지에 preload 링크 추가',
              detail: '<link rel="preload" as="image"> 태그로 LCP 이미지를 조기에 로드합니다.',
            },
            {
              label: 'CDN 도입',
              detail: 'Vercel Edge, Cloudflare CDN 등으로 정적 자원을 사용자 근처에서 제공합니다.',
            },
            {
              label: '서버 응답 시간 단축',
              detail: 'TTFB 목표를 800ms 이하로 설정해 서버 캐싱 및 DB 쿼리를 최적화합니다.',
            },
          ]
        : [
            {
              label: '이미지 포맷 WebP/AVIF 변환',
              detail: 'PNG·JPEG 대비 30~50% 용량을 절감해 로딩 시간을 단축합니다.',
            },
            {
              label: '렌더 블로킹 리소스 제거',
              detail: '<link> 스타일시트를 media query로 분리하고 JS를 defer/async로 로드합니다.',
            },
          ],
    });
  }

  // ── Performance: CLS ────────────────────────────────────────────────────────
  const clsScore = webVitals?.cls?.score ?? keyMetrics.cls?.scoreLabel ?? (keyMetrics.cls ? scoreToMetricScore(keyMetrics.cls.score) : undefined);
  const clsDisplay = webVitals?.cls?.displayValue ?? keyMetrics.cls?.displayValue;

  if (clsScore && clsScore !== 'good' && clsDisplay) {
    const isPoor = clsScore === 'poor';
    const priority: RecommendationPriority = isPoor ? 'critical' : 'high';
    recs.push({
      id: 'cls',
      title: '레이아웃 시프트(CLS) 안정화',
      description: `현재 CLS: ${clsDisplay}. ${isPoor ? '0.25를 초과해 사용자 경험을 크게 해칩니다.' : '0.1~0.25 사이로 시각적 안정성 개선이 필요합니다.'}`,
      priority,
      category: 'performance',
      impact: impactFromPriority(priority),
      metric: 'cls',
      currentValue: clsDisplay,
      actions: [
        {
          label: '이미지·동영상에 width/height 명시',
          detail: '모든 미디어 요소에 크기를 지정해 브라우저가 공간을 사전 예약하게 합니다.',
        },
        {
          label: 'aspect-ratio CSS 적용',
          detail: 'aspect-ratio: 16/9 등으로 반응형 환경에서도 레이아웃 공간을 확보합니다.',
        },
        {
          label: '동적 콘텐츠 공간 예약',
          detail: '광고·배너·폰트 로드 전 min-height를 지정해 레이아웃 이동을 방지합니다.',
        },
        {
          label: 'font-display: optional 설정',
          detail: '폰트 교체 시 레이아웃 시프트를 최소화합니다.',
        },
      ],
    });
  }

  // ── Performance: TBT ────────────────────────────────────────────────────────
  const tbtScore = webVitals?.tbt?.score ?? keyMetrics.tbt?.scoreLabel ?? (keyMetrics.tbt ? scoreToMetricScore(keyMetrics.tbt.score) : undefined);
  const tbtDisplay = webVitals?.tbt?.displayValue ?? keyMetrics.tbt?.displayValue;

  if (tbtScore && tbtScore !== 'good' && tbtDisplay) {
    const isPoor = tbtScore === 'poor';
    const priority: RecommendationPriority = isPoor ? 'high' : 'medium';
    recs.push({
      id: 'tbt',
      title: '메인 스레드 블로킹 시간(TBT) 감소',
      description: `현재 TBT: ${tbtDisplay}. ${isPoor ? '600ms를 초과해 인터랙션 응답 지연이 심각합니다.' : '200ms~600ms 사이로 상호작용 지연이 발생하고 있습니다.'}`,
      priority,
      category: 'performance',
      impact: impactFromPriority(priority),
      metric: 'tbt',
      currentValue: tbtDisplay,
      actions: [
        {
          label: 'dynamic import()로 코드 스플리팅',
          detail: '초기 번들 크기를 줄이고, 필요한 코드만 지연 로드해 TBT를 단축합니다.',
        },
        {
          label: 'Long Task를 작은 작업으로 분할',
          detail: '50ms 이상 실행되는 작업을 setTimeout/scheduler.yield()로 분할합니다.',
        },
        {
          label: 'Web Worker 활용',
          detail: '무거운 연산을 메인 스레드 외부로 이동해 UI 응답성을 유지합니다.',
        },
        {
          label: '불필요한 polyfill 제거',
          detail: '타겟 브라우저에 맞게 번들에서 폴리필을 제거해 JS 파싱 시간을 줄입니다.',
        },
      ],
    });
  }

  // ── Performance: FCP ────────────────────────────────────────────────────────
  const fcpScore = webVitals?.fcp?.score ?? keyMetrics.fcp?.scoreLabel ?? (keyMetrics.fcp ? scoreToMetricScore(keyMetrics.fcp.score) : undefined);
  const fcpDisplay = webVitals?.fcp?.displayValue ?? keyMetrics.fcp?.displayValue;

  if (fcpScore && fcpScore !== 'good' && fcpDisplay) {
    const isPoor = fcpScore === 'poor';
    const priority: RecommendationPriority = isPoor ? 'high' : 'medium';
    recs.push({
      id: 'fcp',
      title: '첫 콘텐츠 표시(FCP) 속도 개선',
      description: `현재 FCP: ${fcpDisplay}. 사용자가 첫 시각 요소를 보기까지 시간이 깁니다.`,
      priority,
      category: 'performance',
      impact: impactFromPriority(priority),
      metric: 'fcp',
      currentValue: fcpDisplay,
      actions: [
        {
          label: 'Critical CSS 인라인화',
          detail: 'Above-the-fold 스타일을 <style> 태그로 HTML에 직접 포함해 렌더 블로킹을 제거합니다.',
        },
        {
          label: '웹폰트 preconnect 적용',
          detail: '<link rel="preconnect"> 및 font-display: swap을 설정해 폰트 로딩을 최적화합니다.',
        },
        {
          label: 'JS를 defer·async로 로드',
          detail: '파서 블로킹 스크립트를 제거해 HTML 파싱을 우선 완료합니다.',
        },
      ],
    });
  }

  // ── Performance: TTFB ───────────────────────────────────────────────────────
  const ttfb = webVitals?.ttfb;
  if (ttfb && ttfb.score !== 'good') {
    const priority: RecommendationPriority = ttfb.score === 'poor' ? 'high' : 'medium';
    recs.push({
      id: 'ttfb',
      title: '서버 첫 응답 시간(TTFB) 단축',
      description: `현재 TTFB: ${ttfb.displayValue}. 서버 처리 또는 네트워크 지연이 전체 성능에 영향을 미칩니다.`,
      priority,
      category: 'performance',
      impact: impactFromPriority(priority),
      metric: 'ttfb',
      currentValue: ttfb.displayValue,
      actions: [
        {
          label: 'CDN·엣지 네트워크 도입',
          detail: '사용자 근처의 엣지 서버에서 응답해 네트워크 지연을 최소화합니다.',
        },
        {
          label: '서버 사이드 캐싱 적용',
          detail: 'Redis·Memcached 등으로 반복 요청 결과를 캐시해 응답 시간을 단축합니다.',
        },
        {
          label: 'DB 쿼리 최적화',
          detail: '인덱스 추가, N+1 쿼리 제거, 쿼리 캐싱으로 DB 응답 속도를 높입니다.',
        },
      ],
    });
  }

  // ── Performance: TTI ────────────────────────────────────────────────────────
  const tti = keyMetrics.tti;
  const ttiScore = tti?.scoreLabel ?? (tti ? scoreToMetricScore(tti.score) : undefined);
  if (tti && ttiScore && ttiScore !== 'good') {
    recs.push({
      id: 'tti',
      title: '인터랙션 가능 시간(TTI) 단축',
      description: `현재 TTI: ${tti.displayValue}. 페이지가 완전히 반응 가능 상태가 되기까지 오랜 시간이 걸립니다.`,
      priority: 'medium',
      category: 'performance',
      impact: 'medium',
      metric: 'tti',
      currentValue: tti.displayValue,
      actions: [
        {
          label: 'Lazy loading 적용',
          detail: '스크롤 영역 밖 이미지·컴포넌트에 loading="lazy" 또는 React.lazy()를 적용합니다.',
        },
        {
          label: 'Tree shaking으로 번들 크기 감소',
          detail: '사용하지 않는 코드를 제거해 초기 JS 파싱·실행 시간을 줄입니다.',
        },
      ],
    });
  }

  // ── Performance 일반 (특정 메트릭 추천이 없지만 점수가 낮은 경우) ──────────
  const perfScore = categories.performance.score;
  if (perfScore < 0.5 && !recs.some((r) => r.category === 'performance')) {
    recs.push({
      id: 'performance-general',
      title: '전반적인 성능 개선 긴급 필요',
      description: `성능 점수 ${Math.round(perfScore * 100)}점. Core Web Vitals 전 항목 점검이 필요합니다.`,
      priority: 'critical',
      category: 'performance',
      impact: 'high',
      actions: [
        {
          label: 'Core Web Vitals 지표 우선 확인',
          detail: 'LCP, CLS, FCP, TBT 지표를 개별적으로 분석해 최우선 개선 대상을 찾습니다.',
        },
        {
          label: '렌더 블로킹 리소스 제거',
          detail: '초기 렌더를 지연시키는 CSS/JS를 비동기 로드로 전환합니다.',
        },
        {
          label: '이미지 전반 최적화',
          detail: '모든 이미지에 next/image·WebP 변환·압축을 적용합니다.',
        },
      ],
    });
  }

  // ── Accessibility ────────────────────────────────────────────────────────────
  const a11yScore = categories.accessibility.score;
  if (a11yScore < 0.9) {
    const priority: RecommendationPriority = a11yScore < 0.7 ? 'high' : 'medium';
    recs.push({
      id: 'accessibility',
      title: '접근성 개선',
      description: `접근성 점수 ${Math.round(a11yScore * 100)}점. ${a11yScore < 0.7 ? '장애가 있는 사용자가 콘텐츠에 접근하기 어렵습니다.' : '일부 접근성 항목에서 개선 여지가 있습니다.'}`,
      priority,
      category: 'accessibility',
      impact: impactFromPriority(priority),
      actions:
        a11yScore < 0.7
          ? [
              {
                label: 'ARIA 레이블 추가',
                detail: '대화형 요소(버튼·링크·폼)에 aria-label 또는 aria-labelledby를 지정합니다.',
              },
              {
                label: '색상 대비 4.5:1 이상 확보',
                detail: 'WCAG AA 기준을 충족하도록 텍스트와 배경 색상 대비를 높입니다.',
              },
              {
                label: '키보드 탐색 보장',
                detail: '탭 순서가 논리적인지 확인하고 포커스 스타일(:focus-visible)을 명확히 표시합니다.',
              },
              {
                label: '이미지에 alt 텍스트 추가',
                detail: '모든 의미 있는 이미지에 설명적인 alt 속성을 지정합니다.',
              },
            ]
          : [
              {
                label: 'axe-core 접근성 감사',
                detail: 'axe DevTools 또는 jest-axe로 자동화 접근성 테스트를 추가합니다.',
              },
              {
                label: '스크린 리더 직접 테스트',
                detail: 'NVDA(Windows) 또는 VoiceOver(Mac)로 주요 사용자 흐름을 직접 검증합니다.',
              },
            ],
    });
  }

  // ── Best Practices ───────────────────────────────────────────────────────────
  const bpScore = categories.bestPractices.score;
  if (bpScore < 0.9) {
    const priority: RecommendationPriority = bpScore < 0.7 ? 'medium' : 'low';
    recs.push({
      id: 'best-practices',
      title: '모범 사례 준수',
      description: `모범 사례 점수 ${Math.round(bpScore * 100)}점. ${bpScore < 0.7 ? '보안·호환성 관련 개선이 필요합니다.' : '일부 권고 사항 적용으로 점수를 높일 수 있습니다.'}`,
      priority,
      category: 'best-practices',
      impact: impactFromPriority(priority),
      actions:
        bpScore < 0.7
          ? [
              {
                label: 'HTTPS 전환 및 HTTP/2 활성화',
                detail: '모든 리소스를 HTTPS로 제공하고 HTTP/2 멀티플렉싱으로 요청 효율을 높입니다.',
              },
              {
                label: 'deprecated API 교체',
                detail: 'document.write(), 구형 JavaScript API 등을 현대적 대안으로 교체합니다.',
              },
              {
                label: '콘솔 에러 해결',
                detail: '브라우저 콘솔의 에러·경고를 모두 해결해 런타임 안정성을 확보합니다.',
              },
            ]
          : [
              {
                label: '브라우저 콘솔 경고 정리',
                detail: '콘솔 경고(warning)를 줄여 개발자 경험과 디버깅 효율을 높입니다.',
              },
              {
                label: '보안 헤더 추가',
                detail: 'Content-Security-Policy, X-Frame-Options 헤더를 설정해 보안을 강화합니다.',
              },
            ],
    });
  }

  // ── SEO ──────────────────────────────────────────────────────────────────────
  const seoScore = categories.seo.score;
  if (seoScore < 0.9) {
    const priority: RecommendationPriority = seoScore < 0.7 ? 'medium' : 'low';
    recs.push({
      id: 'seo',
      title: 'SEO 최적화',
      description: `SEO 점수 ${Math.round(seoScore * 100)}점. ${seoScore < 0.7 ? '검색 엔진 노출에 치명적인 문제가 있습니다.' : '검색 순위 개선을 위한 SEO 최적화 기회가 있습니다.'}`,
      priority,
      category: 'seo',
      impact: impactFromPriority(priority),
      actions:
        seoScore < 0.7
          ? [
              {
                label: 'meta description 최적화',
                detail: '각 페이지에 고유한 meta description(120~158자)을 작성해 검색 노출을 개선합니다.',
              },
              {
                label: 'title 태그 최적화',
                detail: '페이지별 고유 title(50~60자)을 지정하고 주요 키워드를 앞에 배치합니다.',
              },
              {
                label: 'robots.txt 및 sitemap.xml 설정',
                detail: 'robots.txt로 크롤 정책을 명확히 하고, sitemap.xml로 색인 효율을 높입니다.',
              },
              {
                label: '모바일 친화적 뷰포트 설정',
                detail: '<meta name="viewport"> 태그로 모바일 렌더링을 최적화합니다.',
              },
            ]
          : [
              {
                label: '구조화 데이터(Schema.org) 추가',
                detail: 'JSON-LD로 기사·제품·FAQ 등의 구조화 데이터를 추가해 리치 스니펫 노출 기회를 높입니다.',
              },
              {
                label: 'Open Graph 태그 최적화',
                detail: 'og:title, og:description, og:image를 설정해 소셜 미디어 공유 시 노출을 최적화합니다.',
              },
            ],
    });
  }

  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}
