import Link from 'next/link';

interface BackButtonProps {
  href?: string;
}

export function BackButton({ href = '/' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
      aria-label="뒤로 가기"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );
}
