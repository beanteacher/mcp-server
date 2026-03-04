# SPRINT 1 PLAN - 디자인 시스템 구축 + 홈 대시보드 리디자인

## Sprint Goal

> 디자인 토큰 기반의 디자인 시스템을 구축하고, 공통 컴포넌트와 홈 대시보드를 새 디자인으로 전환한다.

**기간**: Day 1 ~ Day 3

---

## Figma 파일 URL

| 파일 | URL |
|------|-----|
| 01. Design System | https://www.figma.com/design/CO3vH7wRPIYlAUXFVTiWaa/Design-System?node-id=0-1&p=f&t=mePYFYU7yuq6duPw-0 |
| 02. UX Design | https://www.figma.com/design/Et6TOqpU0VrLUsTrAHjewP/UX-Design?t=qjJ3LZ5LYZC2cMmY-0 |
| 03. UI Design | https://www.figma.com/design/02QfErcBAVxFBRnq0m5lVJ/UI-Design?node-id=9-2&p=f&t=8Xjznwb5QtR25kMW-0 |

---

## 포함 범위

| 항목 | WBS 참조 |
|------|----------|
| 디자인 토큰 정의 (색상, 타이포, 간격, 그림자) + Figma Design System 반영 | 1.1 |
| tailwind.config.ts 토큰 반영 | 1.2 |
| globals.css 기본 스타일 | 1.3 |
| layout.tsx/layout.jsx 중복 해결 | 1.4 |
| Header 컴포넌트 (스펙 + Figma + 구현) | 2.1, 2.2 |
| Navigation 컴포넌트 (스펙 + Figma + 구현) | 2.3, 2.4 |
| 상태 컴포넌트 (Loading, Error, Empty) (스펙 + Figma + 구현) | 2.5, 2.6 |
| 홈 대시보드 리디자인 (스펙 + Figma + 구현) | 3.1, 3.2, 3.3 |

## 제외 범위

| 항목 | 이유 |
|------|------|
| 커밋 타임라인 리디자인 (4.x) | Sprint 2 범위 |
| 일일 요약 리디자인 (5.x) | Sprint 2 범위 |
| 유저 레포지토리 리디자인 (6.x) | Sprint 2 범위 |
| 반응형 전체 적용 (7.x) | Sprint 2~3 범위 (단, Sprint 1에서 기본 반응형은 포함) |
| 다크 모드, 인증, 테스트 | 비MVP |
| Windows Figma 동기화 | 사용자 지시에 의해 제외 |

---

## Sub Agent별 핵심 작업

### UI/UX Designer

| 작업 | 산출물 | 완료기준 |
|------|--------|----------|
| 디자인 토큰 정의 | (1) 마크다운 스펙 문서 (2) `mcp-server/uiux_designer/figma-manifests/day1-2026-03-04/manifest.json` (3) Figma Design System 파일 반영 | primary(blue 계열 5단계), secondary(gray 계열 5단계), accent, semantic(success/warning/error/info) 색상 정의. 타이포: xs/sm/base/lg/xl/2xl 사이즈와 weight. 간격: 4px 단위 스케일(1~16). 라운딩: sm/md/lg/xl/2xl. 그림자: sm/md/lg. Figma Design System 파일에 토큰 프레임 존재. manifest.json이 지정 경로에 저장 |
| Header 컴포넌트 스펙 | (1) 마크다운 스펙 (2) manifest.json (3) Figma UI Design 반영 | 데스크톱: 로고 좌측 + 네비게이션 우측 배치. 높이, 배경색, 보더 명시. Figma UI Design 파일에 Header 프레임 존재 |
| Navigation 스펙 | (1) 마크다운 스펙 (2) manifest.json (3) Figma UI Design 반영 | 3개 도구 링크 + 홈 링크, 활성 상태 시각적 구분(밑줄 or 배경색), 호버 효과. Figma UI Design 파일에 Navigation 프레임 존재 |
| 상태 컴포넌트 스펙 | (1) 마크다운 스펙 (2) manifest.json (3) Figma UI Design 반영 | Loading: 스피너/스켈레톤 선택 + 크기. Error: 아이콘 + 메시지 + 재시도 버튼. Empty: 아이콘 + 안내 메시지. Figma UI Design 파일에 상태 컴포넌트 프레임 존재 |
| 홈 대시보드 스펙 | (1) 마크다운 스펙 (2) `mcp-server/uiux_designer/figma-manifests/day2-2026-03-05/manifest.json` (3) Figma UI Design 반영 | 카드 그리드: mobile 1열, tablet 2열, desktop 3~4열. 카드: 아이콘 크기, 제목/설명 폰트, 패딩, 호버 효과. Figma UI Design 파일에 홈 대시보드 프레임 존재 |

### Frontend Developer

| 작업 | 산출물 | 완료기준 |
|------|--------|----------|
| layout.jsx 제거 | layout.jsx 삭제 | `next build` 성공, layout.tsx만 존재 |
| tailwind.config.ts 토큰 적용 | `tailwind.config.ts` 수정 | UIUX 토큰이 theme.extend에 모두 등록 |
| globals.css 업데이트 | `app/globals.css` 수정 | CSS 리셋 + 기본 타이포 스타일 적용 |
| Header 컴포넌트 구현 | `components/Header.tsx` | 디자인 스펙 + Figma 100% 반영, layout.tsx에서 사용 |
| Navigation 컴포넌트 구현 | `components/Navigation.tsx` | 현재 경로 하이라이트, Next.js Link 사용 |
| 상태 컴포넌트 구현 | `components/LoadingState.tsx`, `components/ErrorState.tsx`, `components/EmptyState.tsx` | 각 컴포넌트 props로 메시지 커스텀 가능 |
| McpToolCard 리디자인 | `components/McpToolCard.tsx` 수정 | 새 디자인 토큰 적용, 호버 효과 |
| 홈 페이지 레이아웃 | `app/page.tsx` 수정 | 새 Header + 새 카드 디자인 적용 |

---

## 완료기준 (Sprint DoD)

| # | 기준 | 검증 방법 |
|---|------|-----------|
| 1 | `next build` 성공 (에러 0건) | 터미널에서 `npm run build` 실행 |
| 2 | layout.jsx 파일 제거됨 | 파일 시스템에서 layout.jsx 부재 확인 |
| 3 | tailwind.config.ts에 디자인 토큰 등록 | 파일 내 theme.extend 섹션에 color/fontSize/spacing/borderRadius/boxShadow 키 존재 |
| 4 | Header, Navigation, LoadingState, ErrorState, EmptyState 컴포넌트 존재 | components/ 디렉토리에 5개 파일 존재 |
| 5 | 홈 페이지에 새 디자인 적용 | 브라우저에서 localhost:3000 접속 시 새 Header + 새 카드 디자인 렌더링 |
| 6 | TypeScript 컴파일 에러 없음 | `npx tsc --noEmit` 에러 0건 |
| 7 | Figma Design System 파일에 토큰 프레임 존재 | Figma 파일 직접 확인 |
| 8 | Figma UI Design 파일에 Header/Nav/상태/홈 프레임 존재 | Figma 파일 직접 확인 |
| 9 | manifest.json이 Git 아카이브 경로에 저장 | `mcp-server/uiux_designer/figma-manifests/day1-2026-03-04/` 및 `day2-2026-03-05/` 디렉토리에 파일 존재 |

---

## 예상 산출물 경로

```
mcp-server/
├── tailwind.config.ts              # 디자인 토큰 반영
├── app/
│   ├── globals.css                  # 기본 스타일 업데이트
│   ├── layout.tsx                   # Header 컴포넌트 적용 (layout.jsx 제거)
│   └── page.tsx                     # 홈 대시보드 리디자인
├── components/
│   ├── Header.tsx                   # [신규] 헤더 컴포넌트
│   ├── Navigation.tsx               # [신규] 네비게이션 컴포넌트
│   ├── LoadingState.tsx             # [신규] 로딩 상태 컴포넌트
│   ├── ErrorState.tsx               # [신규] 에러 상태 컴포넌트
│   ├── EmptyState.tsx               # [신규] 빈 상태 컴포넌트
│   └── McpToolCard.tsx              # 리디자인
├── uiux_designer/
│   └── figma-manifests/
│       ├── day1-2026-03-04/
│       │   └── manifest.json        # [신규] Day 1 Figma 프레임 생성용
│       └── day2-2026-03-05/
│           └── manifest.json        # [신규] Day 2 Figma 프레임 생성용
└── .omc/plans/
    ├── MASTER_PLAN.md               # 마스터 플랜
    ├── WBS.md                       # 작업 분해 구조
    └── SPRINT_PLAN.md               # 스프린트 1 계획
```

---

## 리스크

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|-----------|
| UIUX 스펙/Figma 지연으로 FE 작업 블록 | 중 | 고 | UIUX 작업을 Day 1 우선 배정, FE는 layout.jsx 정리와 tailwind 설정을 선행 |
| layout.tsx/layout.jsx 동시 존재로 빌드 충돌 | 고 | 고 | Sprint 1 첫 작업으로 layout.jsx 제거 |
| 디자인 토큰 변경 시 기존 UI 깨짐 | 중 | 중 | 기존 Tailwind 유틸리티(gray-200, blue-500 등)를 토큰 키로 점진 교체 |
| McpToolCard 인터페이스 변경 시 config/tools.ts 영향 | 저 | 저 | McpTool 인터페이스는 유지, 순수 스타일 변경만 수행 |
| Figma API/플러그인 오류로 프레임 생성 실패 | 중 | 중 | manifest.json을 Git에 먼저 저장, Figma 반영은 수동 폴백 가능 |

---

## 일정 배분

| 일자 | UIUX | FE |
|------|------|----|
| Day 1 | 디자인 토큰 정의 + Figma DS 반영, Header/Nav/상태 스펙 + Figma UI 반영, manifest.json 생성 | layout.jsx 제거, tailwind.config 토큰 반영, globals.css |
| Day 2 | 홈 대시보드 스펙 + Figma UI 반영, manifest.json 생성 | Header, Navigation 컴포넌트 구현 |
| Day 3 | 스펙 리뷰 및 Figma 피드백 | 상태 컴포넌트 구현, McpToolCard + 홈 페이지 리디자인, 빌드 검증 |
