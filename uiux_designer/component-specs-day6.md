# Component Specs — Day 6 (Sprint 4)
> 날짜: 2026-03-05 | 작업: 다크/라이트 모드 + 애니메이션/트랜지션

---

## 1. ThemeToggle (신규)

### 역할
Header에 배치되는 테마 전환 버튼. 다크↔라이트 모드를 토글한다.

### 구조
```
<button> (w-8 h-8, rounded-full)
  <span> (transition-all duration-200, rotate 효과)
    [dark] 달 SVG 아이콘
    [light] 해 SVG 아이콘 + rotate(12deg)
```

### 상태
| 상태 | 표시 |
|------|------|
| dark 모드 | 달(🌙) SVG, rotate(0deg) |
| light 모드 | 해(☀️) SVG, rotate(12deg) |
| 미마운트(SSR) | 빈 w-8 h-8 div (hydration mismatch 방지) |

### 토큰
| 속성 | 다크 | 라이트 |
|------|------|--------|
| 아이콘 색 | `text-neutral-400` hover `text-neutral-50` | `text-neutral-400` hover `text-neutral-900` |
| 호버 배경 | `dark:hover:bg-neutral-800` | `hover:bg-neutral-100` |

---

## 2. 전역 테마 시스템

### providers.tsx
- `next-themes` ThemeProvider 래핑
- `attribute="class"` → `<html class="dark">` 토글 방식
- `defaultTheme="dark"` (첫 방문 시 다크)
- `enableSystem={false}` (시스템 설정 무시)
- localStorage 자동 저장 → 새로고침 후 유지

### globals.css 라이트 기본값
| 속성 | 라이트 | 다크 |
|------|--------|------|
| background | `#F8FAFC` | `#0A0F1E` |
| color | `#0A0F1E` | `#F8FAFC` |
| transition | `background-color 0.3s, color 0.3s` | 동일 |

### 라이트↔다크 색상 매핑 (전체 컴포넌트 공통)
| 다크 전용 클래스 | 전환 후 패턴 |
|---|---|
| `bg-surface-card` / `bg-[#1E293B]` | `bg-white dark:bg-surface-card` |
| `bg-neutral-800` (input/badge) | `bg-neutral-100 dark:bg-neutral-800` |
| `text-neutral-50` | `text-neutral-900 dark:text-neutral-50` |
| `text-neutral-400` | `text-neutral-500 dark:text-neutral-400` |
| `text-neutral-600` | `text-neutral-400 dark:text-neutral-600` |
| `border-neutral-800` | `border-neutral-200 dark:border-neutral-800` |
| `divide-neutral-800` | `divide-neutral-200 dark:divide-neutral-800` |
| `hover:bg-neutral-800` | `hover:bg-neutral-100 dark:hover:bg-neutral-800` |
| `bg-primary-900/50` | `bg-primary-50 dark:bg-primary-900/50` |
| `border-neutral-200/10` | `border-neutral-200 dark:border-neutral-200/10` |

---

## 3. 애니메이션/트랜지션

### tailwind.config.ts keyframes

| 이름 | from | to | 시간 |
|------|------|----|------|
| `slide-down` | opacity:0, translateY(-8px) | opacity:1, translateY(0) | 0.2s ease-out |
| `fade-in` | opacity:0 | opacity:1 | 0.25s ease-out |
| `fade-up` | opacity:0, translateY(8px) | opacity:1, translateY(0) | 0.3s ease-out both |

### 적용 위치별 상세

#### 모바일 메뉴 — `animate-slide-down`
- **위치**: `Header.tsx` 드롭다운 div
- **전**: 클릭 즉시 나타남
- **후**: 위→아래 0.2s 슬라이드 진입

#### 페이지 진입 — `animate-fade-in`
- **위치**: `layout.tsx <main>`
- **전**: 페이지 이동 시 콘텐츠 즉시 표시
- **후**: 0.25s opacity 0→1 페이드인

#### 커밋 카드 stagger — `animate-fade-up`
- **위치**: `commits-content.tsx` CommitCard 래퍼 div
- **전**: 전체 카드 동시 표시
- **후**: index × 0.04s 딜레이로 카드별 순차 등장 (아래→위)
- **코드**: `style={{ animationDelay: \`${index * 0.04}s\` }}`

#### McpToolCard 아이콘 — `group-hover:scale-110`
- **위치**: `mcp-tool-card.tsx` 이모지 span
- **전**: 카드 전체만 scale-[1.02]
- **후**: 카드 확대 + 아이콘 추가 scale-110 (이중 강조)
- **구현**: 부모 div에 `group`, 아이콘에 `group-hover:scale-110 transition-transform duration-200`

#### 버튼 클릭 피드백 — `active:scale-95`
- **위치**: 조회 버튼(commit/user-repos), 분석하기 버튼(daily-summary), 다시시도 버튼(ErrorState)
- **전**: 클릭 시 시각적 피드백 없음
- **후**: 누르는 순간 버튼 95%로 축소 → 눌리는 물리적 느낌

#### ThemeToggle 아이콘 전환
- **전**: 달↔해 즉시 교체
- **후**: `transition-all duration-200` + 라이트 모드 시 `rotate(12deg)`

---

## 4. CommitCard 줄바꿈 수정

### 변경 내용
- **전**: `truncate` → 한 줄 말줄임(...), 모바일에서 컨테이너 overflow
- **후**: `break-words` → 긴 커밋 메시지 줄바꿈 허용

### 이유
모바일 화면에서 긴 커밋 메시지가 `whitespace-nowrap`으로 인해 수평 스크롤 발생.
줄바꿈 방식이 가독성과 레이아웃 안정성 모두 유리함.

---

## 5. 수정 파일 목록

| 파일 | 변경 유형 |
|------|-----------|
| `app/providers.tsx` | 신규 |
| `components/ThemeToggle.tsx` | 신규 |
| `tailwind.config.ts` | darkMode + keyframes + animation |
| `app/globals.css` | 라이트 기본값, transition |
| `app/layout.tsx` | Providers, suppressHydrationWarning, animate-fade-in |
| `components/Header.tsx` | ThemeToggle, animate-slide-down, dark: |
| `components/Navigation.tsx` | dark: |
| `components/EmptyState.tsx` | dark: |
| `components/ErrorState.tsx` | dark:, active:scale-95 |
| `components/LoadingState.tsx` | dark: |
| `components/ui/back-button/back-button.tsx` | dark: |
| `components/common/mcp-tool-card/mcp-tool-card.tsx` | group, scale |
| `components/common/commit-card/commit-card.tsx` | dark:, break-words |
| `components/features/commits/commits-content.tsx` | dark:, stagger |
| `components/features/commits/commit-search-form.tsx` | dark:, active:scale-95 |
| `components/features/daily-summary/daily-summary-content.tsx` | dark: |
| `components/features/daily-summary/daily-summary-form.tsx` | dark:, active:scale-95 |
| `components/features/user-repos/user-repos-content.tsx` | dark: |
| `components/features/user-repos/user-repo-search-form.tsx` | dark:, active:scale-95 |
