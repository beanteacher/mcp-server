# Design Tokens — MCP Tools Dashboard

> 기준일: 2026-03-04 | Sprint 1 Day 1
> 테마: Dark / Tech 계열

---

## 1. Color

### Primary (Blue 계열)

| Token | Hex | 용도 |
|-------|-----|------|
| `primary-50` | `#EFF6FF` | 매우 연한 강조 배경 |
| `primary-300` | `#93C5FD` | 비활성 강조, 보조 |
| `primary-500` | `#3B82F6` | 기본 Brand Color (버튼, 링크) |
| `primary-700` | `#1D4ED8` | hover 상태 |
| `primary-900` | `#1E3A8A` | 강한 강조, 활성 인디케이터 |

### Neutral (Gray 계열)

| Token | Hex | 용도 |
|-------|-----|------|
| `neutral-50` | `#F8FAFC` | 밝은 배경 (라이트 모드) |
| `neutral-200` | `#E2E8F0` | 보더, 구분선 |
| `neutral-400` | `#94A3B8` | Placeholder, 비활성 텍스트 |
| `neutral-600` | `#475569` | 보조 텍스트 |
| `neutral-800` | `#1E293B` | 카드 배경 (다크) |
| `neutral-950` | `#0A0F1E` | 최상위 배경 (다크) |

### Semantic

| Token | Hex | 용도 |
|-------|-----|------|
| `success` | `#22C55E` | 성공, 완료 상태 |
| `warning` | `#F59E0B` | 경고, 주의 상태 |
| `error` | `#EF4444` | 에러, 실패 상태 |
| `info` | `#38BDF8` | 정보, 안내 상태 |

### Surface

| Token | Hex | 용도 |
|-------|-----|------|
| `surface-background` | `#0A0F1E` | 전체 페이지 배경 |
| `surface-card` | `#1E293B` | 카드, 패널 배경 |
| `surface-overlay` | `rgba(0,0,0,0.6)` | 모달 오버레이 |

---

## 2. Typography

### Font Size

| Token | Value | 용도 |
|-------|-------|------|
| `text-xs` | `12px` | 보조 레이블, 배지 |
| `text-sm` | `14px` | 보조 텍스트, 캡션 |
| `text-base` | `16px` | 본문 기본 |
| `text-lg` | `18px` | 강조 본문 |
| `text-xl` | `20px` | 소제목 |
| `text-2xl` | `24px` | 섹션 제목 |
| `text-3xl` | `30px` | 페이지 타이틀 |

### Font Weight

| Token | Value | 용도 |
|-------|-------|------|
| `font-normal` | `400` | 일반 본문 |
| `font-medium` | `500` | 강조 텍스트 |
| `font-semibold` | `600` | 레이블, 버튼 |
| `font-bold` | `700` | 제목, 헤더 |

### Line Height

| Token | Value | 용도 |
|-------|-------|------|
| `leading-tight` | `1.25` | 제목, 헤더 |
| `leading-normal` | `1.5` | 일반 본문 |
| `leading-relaxed` | `1.75` | 긴 본문, 설명 |

---

## 3. Spacing (4px base)

| Token | Value | px |
|-------|-------|----|
| `spacing-1` | `0.25rem` | 4px |
| `spacing-2` | `0.5rem` | 8px |
| `spacing-3` | `0.75rem` | 12px |
| `spacing-4` | `1rem` | 16px |
| `spacing-5` | `1.25rem` | 20px |
| `spacing-6` | `1.5rem` | 24px |
| `spacing-8` | `2rem` | 32px |
| `spacing-10` | `2.5rem` | 40px |
| `spacing-12` | `3rem` | 48px |
| `spacing-16` | `4rem` | 64px |

---

## 4. Border Radius

| Token | Value | 용도 |
|-------|-------|------|
| `rounded-sm` | `4px` | 인풋, 작은 뱃지 |
| `rounded-md` | `8px` | 버튼, 태그 |
| `rounded-lg` | `12px` | 카드 |
| `rounded-xl` | `16px` | 모달, 패널 |
| `rounded-2xl` | `24px` | 대형 카드 |
| `rounded-full` | `9999px` | 아바타, 원형 버튼 |

---

## 5. Box Shadow

| Token | Value | 용도 |
|-------|-------|------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | 인풋, 소형 요소 |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.5)` | 카드 기본 |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.5)` | 드롭다운, 팝오버 |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.6)` | 모달, 오버레이 |
