# Component Specs — Sprint 2 Day 4 (2026-03-05)

> 3개 페이지 다크 테마 UI 스펙

---

## 공통 다크 테마 토큰

| 용도 | 토큰 | 값 |
|------|------|-----|
| 페이지 배경 | surface-background | #0A0F1E |
| 카드 배경 | surface-card | #1E293B |
| 카드 보더 | neutral-800 | #1E293B |
| 기본 텍스트 | neutral-50 | #F8FAFC |
| 보조 텍스트 | neutral-400 | #94A3B8 |
| 비활성 텍스트 | neutral-600 | #475569 |
| 인풋 배경 | neutral-800 | #1E293B |
| 인풋 포커스 | primary-500 | #3B82F6 |
| 링크/강조 | primary-300 | #93C5FD |
| 버튼 배경 | primary-500 | #3B82F6 |
| 버튼 hover | primary-700 | #1D4ED8 |

---

## 공통 인풋 스타일

```
bg-neutral-800 border border-neutral-800 text-neutral-50
placeholder:text-neutral-600 rounded-lg px-3 py-2 text-sm
focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
```

---

## 1. 커밋 타임라인 페이지 (/commits)

### 1-1. 페이지 헤더
| 요소 | 클래스 |
|------|--------|
| 뒤로가기 링크 | `text-neutral-600 hover:text-neutral-50 transition-colors text-sm font-medium` |
| 페이지 제목 | `text-lg font-semibold text-neutral-50` |

### 1-2. CommitCard
| 요소 | 클래스 |
|------|--------|
| 타임라인 도트 | `w-3 h-3 rounded-full bg-primary-500 ring-2 ring-primary-900 flex-shrink-0` |
| 타임라인 선 | `w-0.5 h-full bg-neutral-800 mt-1` |
| 커밋 메시지 | `text-sm font-medium text-neutral-50 leading-snug` |
| SHA 코드 블록 | `text-xs bg-neutral-800 text-primary-300 px-1.5 py-0.5 rounded font-mono` |
| 작성자 | `text-xs text-neutral-400` |
| 구분자 | `text-xs text-neutral-600` |
| 시간 | `text-xs text-neutral-400` |

### 1-3. 날짜 구분 헤더
| 요소 | 클래스 |
|------|--------|
| 날짜 텍스트 | `text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3` |

### 1-4. 커밋 카드 컨테이너
| 요소 | 클래스 |
|------|--------|
| 컨테이너 | `bg-surface-card border border-neutral-800 rounded-xl px-5 divide-y divide-neutral-800` |

### 1-5. 빈/에러 상태
- 에러: `ErrorState` 공통 컴포넌트 사용
- 빈 상태: `EmptyState message="저장소를 입력하세요" description="owner/repo 형식으로 입력 후 조회하세요."` 또는 `EmptyState message="커밋이 없습니다" description="해당 저장소에 커밋 내역이 없습니다."`

---

## 2. 일일 요약 페이지 (/daily-summary)

### 2-1. 페이지 헤더
| 요소 | 클래스 |
|------|--------|
| 뒤로가기 링크 | `text-neutral-600 hover:text-neutral-50 transition-colors text-sm font-medium` |
| 페이지 제목 | `text-lg font-semibold text-neutral-50` |
| 모델 목록 링크 | `text-xs text-neutral-600 hover:text-primary-300 transition-colors` |

### 2-2. 현재 모델 배지
| 요소 | 클래스 |
|------|--------|
| 라벨 | `text-xs text-neutral-400` |
| 모델명 배지 | `font-mono text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded` |

### 2-3. 모델 목록 (showModels 상태)
| 요소 | 클래스 |
|------|--------|
| 컨테이너 | `bg-surface-card border border-neutral-800 rounded-xl divide-y divide-neutral-800` |
| 모델명 | `font-mono text-sm text-neutral-50` |
| "이 모델로 분석" 버튼 | `text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-primary-300 transition-colors` |
| 섹션 제목 | `text-sm font-semibold text-neutral-50` |
| 돌아가기 링크 | `text-xs text-primary-300 hover:underline` |

### 2-4. 분석 커밋 수 배지
| 요소 | 클래스 |
|------|--------|
| 배지 | `text-xs bg-primary-900 text-primary-300 px-2 py-1 rounded-full font-medium` |
| 날짜 | `text-xs text-neutral-400` |

### 2-5. AI 분석 결과 카드
| 요소 | 클래스 |
|------|--------|
| 카드 컨테이너 | `bg-surface-card border border-neutral-800 rounded-xl p-6` |
| h2 제목 | `text-base font-bold text-neutral-50 mt-4 mb-2` |
| h3 소제목 | `text-sm font-semibold text-neutral-200 mt-4 mb-2` |
| 리스트 항목 | `text-sm text-neutral-400 ml-3 mb-1` |
| 본문 텍스트 | `text-sm text-neutral-400 mb-1` |

### 2-6. 에러 상태
- `ErrorState` 공통 컴포넌트 사용

---

## 3. 유저 레포지토리 페이지 (/user-repos)

### 3-1. 페이지 헤더
| 요소 | 클래스 |
|------|--------|
| 뒤로가기 링크 | `text-neutral-600 hover:text-neutral-50 transition-colors text-sm font-medium` |
| 페이지 제목 | `text-lg font-semibold text-neutral-50` |

### 3-2. 레포 개수
| 요소 | 클래스 |
|------|--------|
| 총 개수 텍스트 | `text-xs text-neutral-400 mb-3` |

### 3-3. 레포 카드
| 요소 | 클래스 |
|------|--------|
| 목록 컨테이너 | `bg-surface-card border border-neutral-800 rounded-xl divide-y divide-neutral-800` |
| 카드 행 | `flex items-start justify-between px-5 py-4 hover:bg-neutral-800 transition-colors` |
| 레포 이름 | `text-sm font-medium text-primary-300 truncate` |
| 설명 | `text-xs text-neutral-400 mt-0.5 truncate` |
| 날짜 | `text-xs text-neutral-600 mt-1` |

### 3-4. 언어 뱃지 & 스타
| 요소 | 클래스 |
|------|--------|
| 언어 뱃지 | `text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full` |
| 스타 | `text-xs text-warning` |

### 3-5. 빈/에러 상태
- 에러: `ErrorState` 공통 컴포넌트
- 빈 상태: `EmptyState message="레포지토리가 없습니다" description="해당 유저의 공개 레포지토리가 없습니다."`
- 미입력: `EmptyState message="유저명을 입력하세요" description="GitHub 유저명을 입력 후 조회하세요."`

---

## Figma 작업 명세

### 생성 프레임 목록
1. `Sprint2 / Commits Timeline` — 커밋 타임라인 페이지 다크 테마
2. `Sprint2 / Daily Summary` — 일일 요약 페이지 다크 테마
3. `Sprint2 / User Repos` — 유저 레포지토리 페이지 다크 테마

### Figma 파일
- 03. UI Design: https://www.figma.com/design/02QfErcBAVxFBRnq0m5lVJ/UI-Design
