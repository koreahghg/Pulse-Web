import type { Metadata } from 'next';
import { AuditAnalyzer } from '@/components/audit/AuditAnalyzer';

export const metadata: Metadata = {
  title: '성능 감사',
};

export default function AuditPage() {
  return <AuditAnalyzer />;
}
