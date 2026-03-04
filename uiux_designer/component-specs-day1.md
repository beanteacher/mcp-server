# Component Specs — Day 1

> 기준일: 2026-03-04 | Sprint 1 Day 1
> FE 즉시 구현 가능한 수치/토큰명 기준으로 작성

---

## 1. Header

| 속성 | 값 |
|------|----|
| 높이 | `64px` (spacing-16) |
| 배경색 | `surface-card` = `#1E293B` |
| 하단 보더 | `1px solid neutral-200` = `#E2E8F0` at `opacity-10` |
| padding (좌우) | `spacing-6` = `24px` |
| z-index | `50` (sticky) |
| position | `fixed top-0 left-0 right-0` |

**로고 영역**
- 좌측 정렬
- 폰트: `text-xl` + `font-bold`
- 색상: `primary-500` = `#3B82F6`
- 텍스트: `MCP Tools`

**우측 영역**
- 사용자 아바타: `32px × 32px`, `rounded-full`, `border: 1px solid primary-500`
- 아바타와 헤더 우측 edge 간격: `spacing-4`

---

## 2. Navigation

| 속성 | 값 |
|------|----|
| 위치 | Header 내부 중앙 or 좌측 로고 우측 |
| 방향 | 수평 (flex row) |
| 아이템 간격 | `spacing-2` = `8px` |
| padding (아이템) | `spacing-2 spacing-4` = `8px 16px` |
| `border-radius` | `rounded-md` = `8px` |

**링크 목록**
1. 홈 (`/`)
2. 커밋 타임라인 (`/commit-timeline`)
3. 오늘 요약 (`/today-summary`)
4. 유저 레포 (`/user-repos`)

**상태별 스타일**

| 상태 | 배경 | 텍스트 색상 | 폰트 |
|------|------|-------------|------|
| 기본 | 투명 | `neutral-400` = `#94A3B8` | `font-medium` |
| hover | `neutral-800` = `#1E293B` | `neutral-50` = `#F8FAFC` | `font-medium` |
| active | `primary-900` = `#1E3A8A` | `primary-300` = `#93C5FD` | `font-semibold` |

**transition**: `all 150ms ease-in-out`

---

## 3. LoadingState

| 속성 | 값 |
|------|----|
| 레이아웃 | `flex flex-col items-center justify-center` |
| 최소 높이 | `240px` |
| 배경 | 투명 (부모 컨테이너 배경 사용) |

**스피너**
- 크기: `40px × 40px`
- 테두리: `3px solid neutral-800`
- 활성 테두리: `3px solid primary-500` (상단)
- 애니메이션: `spin 0.8s linear infinite`
- `border-radius`: `rounded-full`

**텍스트**
- 상단 여백: `spacing-4` = `16px`
- 폰트: `text-sm` + `font-medium`
- 색상: `neutral-400` = `#94A3B8`
- 내용: `"불러오는 중..."`

---

## 4. ErrorState

| 속성 | 값 |
|------|----|
| 레이아웃 | `flex flex-col items-center justify-center` |
| 최소 높이 | `240px` |
| padding | `spacing-8` = `32px` |

**아이콘**
- 종류: `⚠` 또는 SVG ExclamationTriangle
- 크기: `48px × 48px`
- 색상: `error` = `#EF4444`
- 하단 여백: `spacing-4`

**메시지 영역**
- 제목: `text-lg` + `font-semibold` + `neutral-50`
- 내용: `text-sm` + `font-normal` + `neutral-400`
- 최대 너비: `320px`, 가운데 정렬

**재시도 버튼**
- 상단 여백: `spacing-6` = `24px`
- 배경: `primary-500` = `#3B82F6`
- hover 배경: `primary-700` = `#1D4ED8`
- 텍스트: `neutral-50`, `font-semibold`, `text-sm`
- padding: `spacing-2 spacing-6` = `8px 24px`
- `border-radius`: `rounded-md` = `8px`
- 내용: `"다시 시도"`

---

## 5. EmptyState

| 속성 | 값 |
|------|----|
| 레이아웃 | `flex flex-col items-center justify-center` |
| 최소 높이 | `240px` |
| padding | `spacing-8` = `32px` |

**아이콘**
- 종류: `📭` 또는 SVG InboxIn
- 크기: `48px × 48px`
- 색상: `neutral-400` = `#94A3B8`
- 하단 여백: `spacing-4`

**안내 메시지**
- 제목: `text-lg` + `font-semibold` + `neutral-400`
- 부제목: `text-sm` + `font-normal` + `neutral-600`
- 최대 너비: `280px`, 가운데 정렬
- 제목 내용: `"표시할 데이터가 없습니다"`
- 부제목 내용: `"조건을 변경하거나 잠시 후 다시 확인해 주세요."`
