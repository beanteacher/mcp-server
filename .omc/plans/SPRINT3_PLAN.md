# SPRINT 3 PLAN - 반응형 레이아웃 + 품질 마무리

## Sprint Goal

> 4개 페이지에 반응형 레이아웃을 적용하고, 네비게이션·에지 케이스·코드 정리를 완료해 MVP를 마무리한다.

**기간**: Day 1~2 (2026-03-05 예정)

---

## Sprint 2 인계 상태 (완료 확인)

| 항목 | 상태 |
|------|------|
| `next build` 성공 | ✅ 에러 0건 |
| `tsc --noEmit` 성공 | ✅ 에러 0건 |
| 4개 페이지 다크 테마 | ✅ 홈/커밋/일일요약/유저레포 |
| 공통 상태 컴포넌트 연결 | ✅ LoadingState/ErrorState/EmptyState |

---

## 포함 범위

| 항목 | WBS | 우선순위 |
|------|-----|----------|
| 반응형 레이아웃 - 홈 대시보드 | 7.1 | P0 |
| 반응형 레이아웃 - 커밋 타임라인 | 7.1 | P0 |
| 반응형 레이아웃 - 일일 요약 | 7.1 | P0 |
| 반응형 레이아웃 - 유저 레포지토리 | 7.1 | P0 |
| 크로스 페이지 네비게이션 검증 | 7.2 | P1 |
| 에지 케이스 처리 (빈 데이터, 긴 텍스트, 네트워크 에러) | 7.2 | P1 |
| 미사용 코드/의존성 정리 | 7.3 | P2 |

## 제외 범위

| 항목 | 이유 |
|------|------|
| 다크 모드 토글 | 비MVP |
| 새 MCP 도구 추가 | 비MVP |
| 사용자 인증 | 비MVP |
| 애니메이션/트랜지션 | 비MVP |
| 테스트 코드 | 비MVP |

---

## Day 1 작업

### UI/UX Designer

| 작업 | 산출물 | 완료기준 |
|------|--------|----------|
| 반응형 브레이크포인트 스펙 작성 | `component-specs-day5.md` | mobile(360px)/tablet(768px)/desktop(1280px) 3단 레이아웃 명시. 4개 페이지별 그리드/컬럼/간격 수치 명시. 네비게이션 모바일 대응 방식(햄버거 메뉴 vs 하단 탭 등) 명시 |
| Figma 반응형 프레임 생성 | `figma-manifests/day5-YYYY-MM-DD/` | 각 페이지 3개 뷰포트 프레임 존재 |

### Frontend Developer

| 작업 | 대상 파일 | 완료기준 |
|------|-----------|----------|
| Header/Navigation 반응형 | `components/Header.tsx`, `components/Navigation.tsx` | mobile: 햄버거 or 하단 탭. tablet/desktop: 현재 레이아웃 유지 |
| 홈 대시보드 반응형 | `app/page.tsx` | mobile: 1열 카드. tablet: 2열. desktop: 3열 |
| 커밋 타임라인 반응형 | `app/commits/` | mobile: 폼 세로 스택. 타임라인 좌우 패딩 축소 |
| 일일 요약 반응형 | `app/daily-summary/` | mobile: 모델 선택 풀 width. 결과 카드 패딩 축소 |
| 유저 레포지토리 반응형 | `app/user-repos/` | mobile: 레포 카드 1열. 언어 뱃지 줄 바꿈 허용 |

---

## Day 2 작업

### Frontend Developer

| 작업 | 대상 파일 | 완료기준 |
|------|-----------|----------|
| 네비게이션 검증 | 전 페이지 | 모든 페이지 간 이동 링크 정상 동작. 뒤로가기 버튼 동작 확인 |
| 에지 케이스 - 긴 텍스트 | CommitCard, 레포 카드 등 | 긴 커밋 메시지/레포명 truncate 또는 wrap 처리. overflow 깨짐 없음 |
| 에지 케이스 - 빈 데이터 | commits/daily-summary/user-repos | EmptyState 정상 표시. 조건 분기 누락 없음 |
| 에지 케이스 - 네트워크 에러 | API route 전체 | ErrorState 정상 표시. 재시도 버튼 존재 여부 확인 |
| 미사용 코드 정리 | 전체 | console.log 제거. 주석 처리된 코드 제거. 미사용 import 제거 |

---

## 완료기준 (Sprint 3 DoD)

| # | 기준 | 검증 방법 |
|---|------|-----------|
| 1 | `next build` 성공 (에러 0건) | `npm run build` |
| 2 | `tsc --noEmit` 성공 (에러 0건) | `npx tsc --noEmit` |
| 3 | mobile(360px) 레이아웃 깨짐 없음 | 브라우저 개발자도구 → 360px 에뮬레이션 |
| 4 | tablet(768px) 레이아웃 깨짐 없음 | 브라우저 개발자도구 → 768px 에뮬레이션 |
| 5 | desktop(1280px) 레이아웃 정상 | 브라우저 1280px 창 크기 |
| 6 | 4개 페이지 모든 링크 정상 동작 | 수동 클릭 검증 |
| 7 | EmptyState/ErrorState 모든 페이지 정상 표시 | 빈 쿼리/잘못된 username 입력 테스트 |
| 8 | console.log/미사용 import 0건 | 코드 리뷰 |

---

## 반응형 브레이크포인트 기준

| 뷰포트 | Tailwind prefix | 대상 |
|--------|----------------|------|
| mobile | (기본, 접두사 없음) | 360px~ |
| tablet | `md:` | 768px~ |
| desktop | `lg:` | 1280px~ |

---

## 예상 산출물 경로

```
mcp-server/
├── app/
│   ├── page.tsx                    # 홈 반응형
│   ├── commits/                    # 커밋 반응형
│   ├── daily-summary/              # 일일 요약 반응형
│   └── user-repos/                 # 유저 레포 반응형
├── components/
│   ├── Header.tsx                  # 모바일 대응
│   └── Navigation.tsx              # 모바일 대응
└── uiux_designer/
    ├── component-specs-day5.md     # 반응형 스펙
    └── figma-manifests/
        └── day5-YYYY-MM-DD/
            └── manifest.json       # 반응형 프레임
```

---

## 리스크

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|-----------|
| 모바일 네비게이션 구현 복잡도 | 중 | 중 | 햄버거 메뉴 state 간단하게 구현. 애니메이션 없이 토글만 |
| 기존 고정 px 값으로 인한 반응형 충돌 | 중 | 중 | w-full, max-w-*, min-w-0 활용. px 고정값을 % 또는 Tailwind 단위로 교체 |
| 에지 케이스 누락 발견 시 범위 확대 | 저 | 중 | Day 2에 버퍼 시간 확보. 심각한 케이스만 처리, 미미한 케이스는 비MVP로 분류 |
