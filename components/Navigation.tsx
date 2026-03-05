'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '홈', href: '/' },
  { label: '커밋 타임라인', href: '/commits' },
  { label: '오늘의 요약', href: '/daily-summary' },
  { label: '유저 레포', href: '/user-repos' },
] as const;

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-2">
      {NAV_ITEMS.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={[
              'px-4 py-2 rounded-md text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-primary-50 dark:bg-primary-900 text-primary-300 font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50',
            ].join(' ')}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
