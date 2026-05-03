'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '대시보드' },
  { href: '/audit', label: '성능 감사' },
  { href: '/history', label: '측정 이력' },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-[var(--color-border)] bg-[var(--color-bg-surface)]">
      <div className="p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          메뉴
        </p>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-[var(--color-text-muted)] hover:bg-gray-50 hover:text-[var(--color-text-primary)]'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
