# Sprint 4 Plan — 다크/라이트 모드 + 애니메이션/트랜지션

## Context

MVP(Sprint 1~3)가 완료된 상태. 현재 앱은 다크 테마 고정이며 애니메이션 없음.
비 MVP 기능인 ①라이트/다크 모드 전환 ②애니메이션·트랜지션을 추가해 UI 완성도를 높인다.

---

## 현재 상태 요약

| 항목 | 현황 |
|------|------|
| `darkMode` tailwind 설정 | 없음 (미설정) |
| `next-themes` | 미설치 |
| 전체 컴포넌트 | 다크 클래스 하드코딩 |
| 모바일 메뉴 | 애니메이션 없이 즉시 토글 |
| 페이지 전환 | 없음 |
| 커밋 카드 진입 | 없음 |

---

## Day 1: 다크/라이트 모드

### 1. 패키지 설치
```
npm install next-themes
```

### 2. tailwind.config.ts
- `darkMode: 'class'` 최상단에 추가

### 3. globals.css
- `body` 배경/텍스트 하드코딩 제거
- `.dark body` 블록으로 다크 기본값 이동
- `body` (라이트 기본값): `background-color: #F8FAFC`, `color: #0A0F1E`
- 테마 전환 시 부드럽게: `body { transition: background-color 0.3s, color 0.3s }`

### 4. app/providers.tsx (신규)
```tsx
'use client';
import { ThemeProvider } from 'next-themes';
export function Providers({ children }) {
  return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>{children}</ThemeProvider>;
}
```

### 5. app/layout.tsx
- `<body>`를 `<Providers>`로 감싸기
- `suppressHydrationWarning` → `<html>`에 추가

### 6. components/ThemeToggle.tsx (신규)
- `useTheme()` 훅으로 현재 테마 감지
- 달(🌙) / 해(☀️) SVG 아이콘 토글 버튼
- `mounted` 상태로 hydration mismatch 방지

### 7. components/Header.tsx
- ThemeToggle 컴포넌트 추가 (아바타 옆)

### 8. 컴포넌트 dark: prefix 추가 (14개 파일)

**라이트 ↔ 다크 색상 매핑:**
| 다크 클래스 | 라이트 기본값 | 패턴 |
|---|---|---|
| `bg-[#1E293B]` / `bg-surface-card` | `bg-white` | `bg-white dark:bg-surface-card` |
| `bg-neutral-800` (input/배지) | `bg-neutral-100` | `bg-neutral-100 dark:bg-neutral-800` |
| `text-neutral-50` | `text-neutral-900` | `text-neutral-900 dark:text-neutral-50` |
| `text-neutral-400` | `text-neutral-500` | `text-neutral-500 dark:text-neutral-400` |
| `text-neutral-600` | `text-neutral-400` | `text-neutral-400 dark:text-neutral-600` |
| `border-neutral-800` | `border-neutral-200` | `border-neutral-200 dark:border-neutral-800` |
| `divide-neutral-800` | `divide-neutral-200` | `divide-neutral-200 dark:divide-neutral-800` |
| `hover:bg-neutral-800` | `hover:bg-neutral-100` | `hover:bg-neutral-100 dark:hover:bg-neutral-800` |
| `bg-primary-900/50` | `bg-primary-50` | `bg-primary-50 dark:bg-primary-900/50` |
| `border-b border-neutral-200/10` | `border-b border-neutral-200` | `border-b border-neutral-200 dark:border-neutral-200/10` |

**수정 대상 파일 목록:**
- `components/Header.tsx`
- `components/Navigation.tsx`
- `components/common/mcp-tool-card/mcp-tool-card.tsx`
- `components/common/commit-card/commit-card.tsx`
- `components/EmptyState.tsx`
- `components/ErrorState.tsx`
- `components/LoadingState.tsx`
- `components/ui/back-button/back-button.tsx`
- `components/features/commits/commits-content.tsx`
- `components/features/commits/commit-search-form.tsx`
- `components/features/daily-summary/daily-summary-content.tsx`
- `components/features/daily-summary/daily-summary-form.tsx`
- `components/features/user-repos/user-repos-content.tsx`
- `components/features/user-repos/user-repo-search-form.tsx`

---

## Day 2: 애니메이션/트랜지션

### 1. tailwind.config.ts — keyframes + animation 추가

```ts
animation: {
  'slide-down': 'slideDown 0.2s ease-out',
  'fade-in':    'fadeIn 0.25s ease-out',
  'fade-up':    'fadeUp 0.3s ease-out both',
},
keyframes: {
  slideDown: {
    from: { opacity: '0', transform: 'translateY(-8px)' },
    to:   { opacity: '1', transform: 'translateY(0)' },
  },
  fadeIn: {
    from: { opacity: '0' },
    to:   { opacity: '1' },
  },
  fadeUp: {
    from: { opacity: '0', transform: 'translateY(8px)' },
    to:   { opacity: '1', transform: 'translateY(0)' },
  },
},
```

### 2. 모바일 메뉴 슬라이드 (Header.tsx)
- `isOpen && (...)` → 드롭다운 div에 `animate-slide-down` 추가

### 3. 페이지 진입 fade-in (layout.tsx)
- `<main>`에 `animate-fade-in` 클래스 추가

### 4. 커밋 카드 stagger 진입 (commits-content.tsx)
- `CommitCard` 렌더링 시 `style={{ animationDelay: \`${index * 0.04}s\` }}` + `animate-fade-up`
- 래퍼 div에 적용

### 5. McpToolCard 호버 강화 (mcp-tool-card.tsx)
- `group` 클래스 추가
- 아이콘 span에 `group-hover:scale-110 transition-transform duration-200`
- 이미 있는 `hover:scale-[1.02]` 유지

### 6. 버튼 active 피드백 (전체 공통 버튼)
- `active:scale-95` 추가: ErrorState 재시도 버튼, 폼 조회 버튼

### 7. ThemeToggle 토글 애니메이션
- 아이콘 전환 시 `transition-all duration-200 rotate-0 → rotate-12` 효과

---

## 완료 기준 (Sprint 4 DoD)

| # | 기준 | 결과 |
|---|------|------|
| 1 | `npm run build` 성공 | ✅ |
| 2 | `npx tsc --noEmit` 에러 0건 | ✅ |
| 3 | 라이트 모드: 배경 흰색 계열, 텍스트 어두운 계열로 전환 | ✅ |
| 4 | 다크 모드: 기존과 동일하게 표시 | ✅ |
| 5 | 테마 토글 버튼이 Header에 표시되고 클릭 시 전환 | ✅ |
| 6 | 페이지 새로고침 후 마지막 테마 유지 (next-themes localStorage) | ✅ |
| 7 | 모바일 메뉴 열릴 때 slide-down 애니메이션 | ✅ |
| 8 | 페이지 진입 시 fade-in 효과 | ✅ |
| 9 | 커밋 카드 목록 stagger 진입 | ✅ |
| 10 | McpToolCard 호버 시 아이콘 scale 효과 | ✅ |

---

## 파일 구조 변경 요약

```
신규:
  app/providers.tsx
  components/ThemeToggle.tsx

수정:
  tailwind.config.ts           (darkMode + keyframes + animation)
  app/globals.css              (라이트 기본값, 트랜지션)
  app/layout.tsx               (Providers 래핑, suppressHydrationWarning, animate-fade-in)
  components/Header.tsx        (ThemeToggle, 슬라이드 애니메이션, dark:)
  components/Navigation.tsx    (dark:)
  components/EmptyState.tsx    (dark:)
  components/ErrorState.tsx    (dark:, active:scale-95)
  components/LoadingState.tsx  (dark:)
  components/ui/back-button/back-button.tsx (dark:)
  components/common/mcp-tool-card/mcp-tool-card.tsx (group, scale)
  components/common/commit-card/commit-card.tsx (dark:)
  components/features/commits/commits-content.tsx (dark:, stagger)
  components/features/commits/commit-search-form.tsx (dark:, active:scale-95)
  components/features/daily-summary/daily-summary-content.tsx (dark:)
  components/features/daily-summary/daily-summary-form.tsx (dark:, active:scale-95)
  components/features/user-repos/user-repos-content.tsx (dark:)
  components/features/user-repos/user-repo-search-form.tsx (dark:, active:scale-95)
```

---

## 의존성

- `next-themes@^0.4.x` 설치 완료
- 추가 패키지 없음 (framer-motion 불필요 — Tailwind CSS keyframes로 충분)
