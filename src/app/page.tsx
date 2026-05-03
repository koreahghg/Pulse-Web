import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '대시보드',
};

const CATEGORIES = ['성능', '접근성', '모범 사례', 'SEO'] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">대시보드</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          웹사이트 성능 지표를 한눈에 확인하세요.
        </p>
      </div>

      {/* 카테고리 점수 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((category) => (
          <div
            key={category}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{category}</p>
            <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">--</p>
          </div>
        ))}
      </div>

      {/* 초기 빈 상태 */}
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] py-20">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          분석 결과가 없습니다
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          성능 감사 메뉴에서 URL을 입력해 시작하세요.
        </p>
      </div>
    </div>
  );
}
