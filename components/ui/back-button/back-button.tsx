import Link from 'next/link';

interface BackButtonProps {
  href?: string;
}

export function BackButton({ href = '/' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-800 transition-colors text-neutral-600 hover:text-neutral-50"
      aria-label="뒤로 가기"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );
}
