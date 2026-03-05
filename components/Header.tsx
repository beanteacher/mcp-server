'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { label: '홈', href: '/' },
  { label: '커밋 타임라인', href: '/commits' },
  { label: '오늘의 요약', href: '/daily-summary' },
  { label: '유저 레포', href: '/user-repos' },
] as const;

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-surface-card border-b border-neutral-200 dark:border-neutral-200/10 px-6 flex items-center justify-between">
        <span className="text-xl font-bold text-primary-500">MCP Server</span>
        <div className="hidden md:flex">
          <Navigation />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-8 h-8 rounded-full border border-primary-500 bg-neutral-100 dark:bg-neutral-800" />
          <button
            className="md:hidden p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="메뉴 열기/닫기"
          >
            {isOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </header>
      {isOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-surface-card border-b border-neutral-200 dark:border-neutral-800 md:hidden animate-slide-down">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={[
                  'block px-6 py-4 text-sm font-medium',
                  isActive
                    ? 'text-primary-300 bg-primary-50 dark:bg-primary-900/50'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                ].join(' ')}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
