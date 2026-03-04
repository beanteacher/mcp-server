# Component Specs — Day 2

> 기준일: 2026-03-04 | Sprint 1 Day 2
> Day 1 토큰 기준 — 다크 테마

---

## 1. McpToolCard (리디자인)

### 개요

현재 구조 (white 배경 / gray border / hover시 blue border) 를 다크 테마로 전면 리디자인.

### 카드 기본 스타일

| 속성 | 값 |
|------|----|
| 배경 | `surface-card` = `#1E293B` |
| 보더 | `1px solid rgba(226,232,240,0.10)` = `border-neutral-200/10` |
| border-radius | `rounded-lg` = `12px` |
| padding | `p-6` = `24px` |
| min-height | `160px` |
| display | `flex flex-col items-center text-center` |

### 호버 상태

| 속성 | 값 |
|------|----|
| 보더 | `border-primary-500/50` = `rgba(59,130,246,0.50)` |
| 그림자 | `shadow-md` = `0 4px 6px rgba(0,0,0,0.5)` |
| 스케일 | `scale-[1.02]` |
| 트랜지션 | `transition-all duration-200 ease-in-out` |
| 커서 | `cursor-pointer` |

### 아이콘 영역

| 속성 | 값 |
|------|----|
| 크기 | `48px × 48px` |
| 위치 | 카드 상단 중앙 (`mb-3`) |
| 폰트 크기 (이모지) | `text-3xl` = `30px` |
| 배경 (래퍼) | `rounded-xl bg-neutral-800/60` |
| 래퍼 패딩 | `p-3` = `12px` |

### 제목

| 속성 | 값 |
|------|----|
| 폰트 | `text-base font-semibold` |
| 색상 | `text-neutral-50` = `#F8FAFC` |
| 상단 여백 | `mt-1` = `4px` |

### 설명

| 속성 | 값 |
|------|----|
| 폰트 | `text-sm font-normal` |
| 색상 | `text-neutral-400` = `#94A3B8` |
| 상단 여백 | `mt-2` = `8px` |
| 행간 | `leading-relaxed` = `1.75` |

### 그리드 레이아웃

| 브레이크포인트 | 열 수 | 클래스 |
|----------------|--------|--------|
| mobile (< 768px) | 1열 | `grid-cols-1` |
| tablet (768px~) | 2열 | `md:grid-cols-2` |
| desktop (1024px~) | 3열 | `lg:grid-cols-3` |
| 간격 | `16px` | `gap-4` |

### Tailwind 클래스 전체

```tsx
// 카드 래퍼
<div className="
  flex flex-col items-center text-center
  bg-surface-card border border-neutral-200/10 rounded-lg p-6
  min-h-[160px] cursor-pointer
  transition-all duration-200 ease-in-out
  hover:border-primary-500/50 hover:shadow-md hover:scale-[1.02]
">
  {/* 아이콘 */}
  <div className="rounded-xl bg-neutral-800/60 p-3 mb-3">
    <span className="text-3xl">{icon}</span>
  </div>

  {/* 제목 */}
  <h3 className="text-base font-semibold text-neutral-50 mt-1">{title}</h3>

  {/* 설명 */}
  <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{description}</p>
</div>
```

---

## 2. 홈 대시보드 레이아웃

### 전체 페이지 구조

| 속성 | 값 |
|------|----|
| 배경 | `surface-background` = `#0A0F1E` |
| 상단 여백 | `pt-24` (fixed header 64px 높이 보정) |
| 좌우 패딩 | `px-6` (mobile) / `px-8` (desktop) |
| 최대 너비 | `max-w-6xl mx-auto` |

### 섹션 헤더

| 요소 | 스펙 |
|------|------|
| 섹션 제목 | `"My Tools"` / `text-2xl font-bold text-neutral-50` |
| 섹션 설명 | `text-sm text-neutral-400` / `mt-1` |
| 섹션 하단 여백 | `mb-6` = `24px` |

섹션 설명 텍스트 예시: `"사용 가능한 MCP 도구를 선택하세요"`

### 카드 그리드

| 속성 | 값 |
|------|----|
| display | `grid` |
| 열 구성 | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| 간격 | `gap-4` = `16px` |

### 도구 추가 예정 플레이스홀더 카드

| 속성 | 값 |
|------|----|
| 보더 스타일 | `border-dashed border-2 border-neutral-200/20` |
| 배경 | 투명 |
| 텍스트 색상 | `text-neutral-600` = `#475569` |
| 커서 | `cursor-not-allowed` |
| 텍스트 내용 | `"도구 추가 예정"` |
| 아이콘 | `+` 또는 PlusCircle SVG, `text-neutral-600` |

```tsx
// 플레이스홀더 카드
<div className="
  flex flex-col items-center justify-center text-center
  border-2 border-dashed border-neutral-200/20 rounded-lg p-6
  min-h-[160px] cursor-not-allowed
  text-neutral-600
">
  <span className="text-3xl mb-3">+</span>
  <p className="text-sm font-medium">도구 추가 예정</p>
</div>
```

### 전체 페이지 Tailwind 구조

```tsx
<main className="min-h-screen bg-surface-background">
  <div className="max-w-6xl mx-auto pt-24 px-6 lg:px-8 pb-16">

    {/* 섹션 헤더 */}
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-neutral-50">My Tools</h1>
      <p className="text-sm text-neutral-400 mt-1">사용 가능한 MCP 도구를 선택하세요</p>
    </div>

    {/* 카드 그리드 */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* McpToolCard 목록 */}
      {/* ... */}

      {/* 플레이스홀더 */}
      <div className="flex flex-col items-center justify-center text-center
        border-2 border-dashed border-neutral-200/20 rounded-lg p-6
        min-h-[160px] cursor-not-allowed text-neutral-600">
        <span className="text-3xl mb-3">+</span>
        <p className="text-sm font-medium">도구 추가 예정</p>
      </div>
    </div>

  </div>
</main>
```
