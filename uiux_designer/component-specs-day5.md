# Component Specs — Sprint 3 Day 1 (2026-03-05)

> 반응형 레이아웃 스펙 — Mobile / Tablet / Desktop 3단계 브레이크포인트

---

## 브레이크포인트 정의

| 단계 | 범위 | Tailwind 접두사 |
|------|------|----------------|
| mobile | 360px~ | (접두사 없음, 기본) |
| tablet | 768px~ | `md:` |
| desktop | 1280px~ | `lg:` |

---

## 1. Header + Navigation 반응형

### 현재 코드 구조 (참고)

```
Header: fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between
  ├── "MCP Tools" 텍스트
  ├── <Navigation /> — flex items-center gap-2 (4개 링크)
  └── 아바타 div
```

### 스펙

#### mobile (기본, ~767px)

- Navigation 4개 링크: `hidden md:flex` — 모바일에서 숨김
- 햄버거 버튼 표시: `md:hidden`
- 버튼 클릭 시 헤더 아래 드롭다운 메뉴로 4개 링크 표시

**햄버거 버튼 스타일**

```
md:hidden
text-neutral-400 hover:text-neutral-50 transition-colors
w-6 h-6  (24×24px)
아이콘: ☰ (열기) / ✕ (닫기)
```

**모바일 드롭다운 스타일**

```
position: fixed top-16 left-0 right-0 z-40
bg-surface-card border-b border-neutral-800
각 링크: block px-6 py-3 text-sm
  - active:  text-neutral-50 font-medium
  - inactive: text-neutral-400 hover:text-neutral-50 transition-colors
```

#### tablet / desktop (768px~)

- 현재 레이아웃 유지
- Navigation 링크 수평 표시 (`md:flex`)
- 햄버거 버튼 숨김 (`md:hidden`)

### 구현 클래스 요약

| 요소 | 클래스 |
|------|--------|
| Navigation 컨테이너 | `hidden md:flex items-center gap-2` |
| 햄버거 버튼 | `md:hidden text-neutral-400 hover:text-neutral-50 transition-colors` |
| 모바일 드롭다운 래퍼 | `fixed top-16 left-0 right-0 z-40 bg-surface-card border-b border-neutral-800` |
| 드롭다운 링크 (inactive) | `block px-6 py-3 text-sm text-neutral-400 hover:text-neutral-50 transition-colors` |
| 드롭다운 링크 (active) | `block px-6 py-3 text-sm text-neutral-50 font-medium` |

---

## 2. layout.tsx — main 패딩 반응형

| 브레이크포인트 | 클래스 |
|---------------|--------|
| mobile | `px-4` |
| tablet~ | `md:px-6` |

**적용 예시**

```tsx
// layout.tsx
<main className="pt-16 px-4 md:px-6">
  {children}
</main>
```

---

## 3. CommitSearchForm 반응형

### 현재 구조

```
flex gap-2  →  가로 1줄: [repo input flex-1] [branch input w-32] [count input w-28] [button]
```

### 스펙

| 브레이크포인트 | 레이아웃 | 비고 |
|---------------|----------|------|
| mobile | `flex-col gap-2` | 세로 스택, 각 요소 `w-full` |
| tablet~ (`sm:`) | `sm:flex-row` | 가로 복귀, 원래 `flex-1` / `w-32` / `w-28` 유지 |

**적용 클래스**

```tsx
// 폼 래퍼
<form className="flex flex-col gap-2 sm:flex-row">

  // repo input
  <input className="w-full sm:flex-1 ..." />

  // branch input
  <input className="w-full sm:w-32 ..." />

  // count input
  <input className="w-full sm:w-28 ..." />

  // 조회 버튼
  <button className="w-full sm:w-auto ..." />

</form>
```

---

## 4. DailySummaryForm 반응형

CommitSearchForm과 동일한 패턴 적용.

| 브레이크포인트 | 레이아웃 |
|---------------|----------|
| mobile | `flex-col gap-2`, 각 요소 `w-full` |
| tablet~ (`sm:`) | `sm:flex-row`, 원래 너비 유지 |

**적용 클래스**

```tsx
// 폼 래퍼
<form className="flex flex-col gap-2 sm:flex-row">

  // username input
  <input className="w-full sm:flex-1 ..." />

  // date input
  <input className="w-full sm:w-40 ..." />

  // 조회 버튼
  <button className="w-full sm:w-auto ..." />

</form>
```

---

## 5. 개별 페이지 컨테이너

대상 파일:
- `app/commits/page.tsx`
- `app/daily-summary/page.tsx`
- `app/user-repos/page.tsx`

| 변경 전 | 변경 후 |
|---------|---------|
| `max-w-2xl` | `w-full max-w-2xl` |

**이유:** 모바일에서 `max-w-2xl`만 있으면 컨텐츠가 뷰포트보다 좁게 렌더될 수 있음. `w-full` 추가로 모바일에서 full width 확보.

**적용 예시**

```tsx
<div className="w-full max-w-2xl mx-auto py-8 space-y-6">
  ...
</div>
```

---

## 6. McpToolCard 홈 그리드

**상태: 완료 (이미 반응형 적용됨)**

```tsx
// 현재 적용된 클래스 — 변경 불필요
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
```

| 브레이크포인트 | 컬럼 수 |
|---------------|---------|
| mobile | 1열 |
| sm (640px~) | 2열 |
| md (768px~) | 3열 |

---

## Figma 작업 명세

### 생성 프레임 목록
1. `Sprint3 / Header Mobile` — 햄버거 버튼 + 드롭다운 메뉴 열린 상태
2. `Sprint3 / Header Desktop` — 수평 Navigation 링크
3. `Sprint3 / CommitSearchForm Mobile` — 세로 스택 폼
4. `Sprint3 / CommitSearchForm Desktop` — 가로 인라인 폼

### Figma 파일
- 03. UI Design: https://www.figma.com/design/02QfErcBAVxFBRnq0m5lVJ/UI-Design
