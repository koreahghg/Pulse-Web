import type { Metadata } from 'next';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = {
  title: '대시보드',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">대시보드</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          웹사이트 성능 지표를 한눈에 확인하세요.
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}
