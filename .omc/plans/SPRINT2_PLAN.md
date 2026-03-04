# SPRINT 2 PLAN - 개별 페이지 UI 고도화 (Day 1)

## Sprint Goal

> 3개 페이지(커밋 타임라인 / 일일 요약 / 유저 레포) UI를 다크 테마로 고도화하고 공통 상태 컴포넌트를 연결한다.

**기간**: Day 1 (2026-03-05)

---

## Figma 파일 URL

| 파일 | URL |
|------|-----|
| 03. UI Design | https://www.figma.com/design/02QfErcBAVxFBRnq0m5lVJ/UI-Design?node-id=9-2&p=f&t=8Xjznwb5QtR25kMW-0 |

---

## 포함 범위

| 항목 | WBS 참조 |
|------|----------|
| 커밋 타임라인 리디자인 스펙 + Figma UI 반영 | 4.1 |
| 일일 요약 리디자인 스펙 + Figma UI 반영 | 5.1 |
| 유저 레포지토리 리디자인 스펙 + Figma UI 반영 | 6.1 |
| CommitCard.tsx 리디자인 (다크 테마) | 4.2 |
| 커밋 페이지 레이아웃 업데이트 (상태 컴포넌트 연결) | 4.3 |
| 일일 요약 페이지 UI 구현 (UIUX 스펙 수령 후) | 5.2 |
| 유저 레포지토리 페이지 UI 구현 (UIUX 스펙 수령 후) | 6.2 |

## 제외 범위

| 항목 | 이유 |
|------|------|
| 반응형 전체 적용 (7.x) | Sprint 3 범위 |
| TypeScript 에러 해결 (7.3) | Sprint 3 범위 |
| 빌드 최종 검증 (7.4) | Sprint 3 범위 |
| 다크 모드 토글 (라이트/다크 전환) | 비MVP, 현재는 다크 고정 |
| 새 MCP 도구 추가 | 비MVP |
| Windows Figma 동기화 | 사용자 지시에 의해 제외 |

---

## Sub Agent별 핵심 작업

### UI/UX Designer (Day 1 - 3개 스펙 동시 작업)

| 작업 | WBS | 산출물 | 완료기준 |
|------|-----|--------|----------|
| 커밋 타임라인 페이지 스펙 | 4.1 | (1) 마크다운 스펙 (2) manifest.json (3) Figma UI Design 반영 | CommitCard 다크 테마 스타일(배경, 텍스트 색상, sha 코드 블록, 타임라인 선 색상) 명시. 날짜 구분 헤더 스타일(배경색, 폰트, 간격) 명시. 폼(owner/repo 입력) 다크 테마 스타일 명시. Figma UI Design 파일에 커밋 타임라인 프레임 존재. manifest.json이 `mcp-server/uiux_designer/figma-manifests/day4-2026-03-05/`에 저장 |
| 일일 요약 페이지 스펙 | 5.1 | (1) 마크다운 스펙 (2) manifest.json (3) Figma UI Design 반영 | AI 분석 결과 카드 레이아웃(배경, 보더, 텍스트 계층) 명시. 모델 선택 UI(드롭다운/탭 등) 스타일 명시. 로딩 상태(스피너/스켈레톤), 에러 상태, 빈 상태 다크 테마 스타일 명시. Figma UI Design 파일에 일일 요약 프레임 존재 |
| 유저 레포지토리 페이지 스펙 | 6.1 | (1) 마크다운 스펙 (2) manifest.json (3) Figma UI Design 반영 | 검색 폼 다크 테마 스타일(input 배경, 보더, placeholder 색상, 버튼) 명시. 레포 카드(이름, 설명, 날짜 텍스트 색상) 명시. 언어 뱃지(배경색, 텍스트 색상) 명시. 스타 표시 스타일 명시. 빈/에러 상태 명시. Figma UI Design 파일에 유저 레포 프레임 존재 |

### Frontend Developer (Day 1)

| 작업 | WBS | 산출물 | 완료기준 |
|------|-----|--------|----------|
| CommitCard.tsx 리디자인 | 4.2 | `components/CommitCard.tsx` 수정 | 다크 테마 적용: 타임라인 도트/선 색상 변경, sha 코드 블록 다크 배경, 텍스트 색상 gray-300/400 계열. UIUX 스펙 100% 반영 |
| 커밋 페이지 레이아웃 업데이트 | 4.3 | `app/commits/page.tsx` 수정 | LoadingState/ErrorState/EmptyState 컴포넌트 연결. 날짜 구분 헤더 다크 스타일 적용. owner/repo 입력 폼 다크 테마 적용 |
| 일일 요약 페이지 UI 구현 | 5.2 | `app/daily-summary/page.tsx` 수정 | AI 분석 결과 카드 다크 테마 적용. 공통 상태 컴포넌트(Loading/Error/Empty) 연결. UIUX 스펙 반영 |
| 유저 레포지토리 페이지 UI 구현 | 6.2 | `app/user-repos/page.tsx` 수정 | 검색 폼 다크 테마 적용. 레포 카드/언어 뱃지/스타 표시 다크 스타일 적용. 공통 상태 컴포넌트 연결. UIUX 스펙 반영 |

---

## 완료기준 (Day 1 DoD)

| # | 기준 | 검증 방법 |
|---|------|-----------|
| 1 | `next build` 성공 (에러 0건) | 터미널에서 `npm run build` 실행 |
| 2 | CommitCard.tsx에 다크 테마 스타일 적용 | 코드 리뷰: bg-gray-900/800 계열 + text-gray-300/400 계열 사용 확인 |
| 3 | commits 페이지에 LoadingState/ErrorState/EmptyState 연결 | 코드 리뷰: 3개 상태 컴포넌트 import 및 조건부 렌더링 확인 |
| 4 | daily-summary 페이지 다크 테마 적용 | 브라우저에서 localhost:3000/daily-summary 확인 |
| 5 | user-repos 페이지 다크 테마 적용 | 브라우저에서 localhost:3000/user-repos 확인 |
| 6 | Figma UI Design 파일에 3개 페이지 프레임 존재 | Figma 파일 직접 확인 (커밋/일일요약/유저레포) |
| 7 | manifest.json이 Git 아카이브 경로에 저장 | `mcp-server/uiux_designer/figma-manifests/day4-2026-03-05/` 디렉토리에 파일 존재 |

---

## 예상 산출물 경로

```
mcp-server/
├── app/
│   ├── commits/page.tsx              # 커밋 페이지 다크 테마 + 상태 컴포넌트 연결
│   ├── daily-summary/page.tsx        # 일일 요약 다크 테마 + 상태 컴포넌트 연결
│   └── user-repos/page.tsx           # 유저 레포 다크 테마 + 상태 컴포넌트 연결
├── components/
│   └── CommitCard.tsx                # 다크 테마 리디자인
├── uiux_designer/
│   └── figma-manifests/
│       └── day4-2026-03-05/
│           └── manifest.json         # 3개 페이지 Figma 프레임 생성용
└── .omc/plans/
    └── SPRINT2_PLAN.md               # 본 문서
```

---

## 리스크

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|-----------|
| UIUX 3개 스펙 동시 작업으로 품질 저하 | 중 | 중 | 3개 페이지가 동일한 다크 테마 기반이므로 공통 토큰 먼저 정의 후 페이지별 차이만 추가 |
| FE가 UIUX 스펙 수령 전 작업 블록 | 중 | 고 | FE는 CommitCard/commits 페이지를 Sprint 1 디자인 토큰 기반으로 선행 구현, 스펙 수령 후 미세 조정 |
| 기존 페이지 코드가 라이트 테마 기반이라 다크 전환 시 누락 | 중 | 중 | 페이지별 체크리스트: 배경색, 텍스트 색상, 보더 색상, input 스타일, hover 상태 모두 점검 |
| 공통 상태 컴포넌트(Sprint 1 산출물) 미완성 시 | 저 | 고 | Sprint 1 DoD에서 5개 컴포넌트 존재 확인 완료 전제, 미완성 시 인라인 폴백 |
| Day 1에 5.2, 6.2까지 완료 못할 가능성 | 중 | 중 | 우선순위: 4.2 -> 4.3 -> 5.2 -> 6.2 순서. 6.2 미완료 시 Day 2로 이월 |

---

## 작업 순서 (Day 1 타임라인)

| 순서 | UIUX | FE |
|------|------|----|
| 오전 | 3개 페이지 스펙 동시 작성 시작 (공통 다크 토큰 -> 커밋 -> 일일요약 -> 유저레포) | CommitCard.tsx 다크 테마 리디자인 (Sprint 1 토큰 기반 선행) |
| 오후 전반 | 3개 페이지 Figma UI Design 프레임 생성, manifest.json 작성 | commits/page.tsx 업데이트 (상태 컴포넌트 연결) |
| 오후 후반 | 스펙 완료 -> FE 전달, 리뷰 | daily-summary/page.tsx + user-repos/page.tsx 다크 테마 적용 |
