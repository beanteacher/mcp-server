# Day 1 FE 핸드오프 — tailwind.config 반영 가이드

> 기준일: 2026-03-04 | Sprint 1 Day 1
> 아래 값을 `tailwind.config.ts` 의 `theme.extend` 에 그대로 반영

---

```js
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary (Blue 계열)
        primary: {
          50:  '#EFF6FF',
          300: '#93C5FD',
          500: '#3B82F6', // Brand Color — 버튼, 링크, 아이콘
          700: '#1D4ED8', // hover
          900: '#1E3A8A', // active, 강조 인디케이터
        },
        // Neutral (Gray 계열)
        neutral: {
          50:  '#F8FAFC',
          200: '#E2E8F0',
          400: '#94A3B8',
          600: '#475569',
          800: '#1E293B',
          950: '#0A0F1E',
        },
        // Semantic
        success: '#22C55E',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#38BDF8',
        // Surface
        surface: {
          background: '#0A0F1E',
          card:       '#1E293B',
          overlay:    'rgba(0,0,0,0.6)',
        },
      },

      fontSize: {
        xs:   ['12px', { lineHeight: '1.5' }],
        sm:   ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg:   ['18px', { lineHeight: '1.5' }],
        xl:   ['20px', { lineHeight: '1.25' }],
        '2xl':['24px', { lineHeight: '1.25' }],
        '3xl':['30px', { lineHeight: '1.25' }],
      },

      spacing: {
        1:  '4px',
        2:  '8px',
        3:  '12px',
        4:  '16px',
        5:  '20px',
        6:  '24px',
        8:  '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },

      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'24px',
        full: '9999px',
      },

      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.4)',
        md: '0 4px 6px rgba(0,0,0,0.5)',
        lg: '0 10px 15px rgba(0,0,0,0.5)',
        xl: '0 20px 25px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 컴포넌트별 클래스 요약

### Header
```tsx
<header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-card border-b border-neutral-200/10 px-6 flex items-center">
  <span className="text-xl font-bold text-primary-500">MCP Servers</span>
  {/* nav 영역 */}
  {/* avatar 영역 */}
</header>
```

### Navigation 아이템
```tsx
// 기본
<a className="px-4 py-2 rounded-md text-neutral-400 font-medium transition-all duration-150">링크</a>
// hover
<a className="hover:bg-neutral-800 hover:text-neutral-50">링크</a>
// active
<a className="bg-primary-900 text-primary-300 font-semibold">링크</a>
```

### LoadingState
```tsx
<div className="flex flex-col items-center justify-center min-h-[240px]">
  <div className="w-10 h-10 rounded-full border-[3px] border-neutral-800 border-t-primary-500 animate-spin" />
  <p className="mt-4 text-sm font-medium text-neutral-400">불러오는 중...</p>
</div>
```

### ErrorState
```tsx
<div className="flex flex-col items-center justify-center min-h-[240px] p-8">
  {/* 아이콘 48x48, text-error */}
  <p className="text-lg font-semibold text-neutral-50">오류가 발생했습니다</p>
  <p className="text-sm text-neutral-400 max-w-[320px] text-center">에러 메시지</p>
  <button className="mt-6 px-6 py-2 bg-primary-500 hover:bg-primary-700 text-neutral-50 font-semibold text-sm rounded-md">
    다시 시도
  </button>
</div>
```

### EmptyState
```tsx
<div className="flex flex-col items-center justify-center min-h-[240px] p-8">
  {/* 아이콘 48x48, text-neutral-400 */}
  <p className="text-lg font-semibold text-neutral-400">표시할 데이터가 없습니다</p>
  <p className="text-sm text-neutral-600 max-w-[280px] text-center">
    조건을 변경하거나 잠시 후 다시 확인해 주세요.
  </p>
</div>
```
