# Workspace Memory

## mcp-server 프로젝트

### 기본 정보
- **경로**: ..\mcp-server
- **GitHub**: https://github.com/beanteacher/mcp-server
- **스택**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Gemini API
- **현재 브랜치**: main

### Figma URL
- Design System: https://www.figma.com/design/CO3vH7wRPIYlAUXFVTiWaa/Design-System
- UX Design: https://www.figma.com/design/Et6TOqpU0VrLUsTrAHjewP/UX-Design
- UI Design: https://www.figma.com/design/02QfErcBAVxFBRnq0m5lVJ/UI-Design

### Sprint 현황
- **Sprint 1**: 완료 ✅ (디자인 시스템 + 공통 컴포넌트 + 홈 대시보드 리디자인)
  - tailwind.config.ts 디자인 토큰 반영 (primary/neutral/semantic/surface)
  - 공통 컴포넌트: Header, Navigation, LoadingState, ErrorState, EmptyState
  - McpToolCard 다크 테마 리디자인
  - globals.css 다크 테마 (surface-background #0A0F1E)
- **Sprint 2**: Day 1 완료 ✅ (2026-03-04)
  - CommitCard.tsx 다크 테마 (primary-500 도트, neutral-800 선, primary-300 SHA)
  - uiux_designer/component-specs-day4.md: 3개 페이지 스펙
  - uiux_designer/figma-manifests/day4-2026-03-05/manifest.json
- **Sprint 2**: Day 2 완료 ✅ (2026-03-04, branch: main)
- **Sprint 3**: Day 1 완료 ✅ (2026-03-04, branch: main)
  - Header.tsx 모바일 햄버거 메뉴 + 드롭다운 (md:hidden/hidden md:flex)
  - Navigation.tsx hidden md:flex (데스크탑 전용)
  - layout.tsx px-4 md:px-6 (모바일 패딩)
  - commit-search-form / daily-summary-form flex-col sm:flex-row (모바일 세로 스택)
  - commits/daily-summary/user-repos page w-full max-w-2xl
  - uiux_designer/component-specs-day5.md 반응형 스펙
  - figma-manifests/day5-2026-03-05/ 생성
  - next build 성공 (에러 0건)
  - commits-content.tsx 다크 테마 + LoadingState/ErrorState/EmptyState 연결
  - daily-summary-content.tsx 다크 테마 + LoadingState/ErrorState/EmptyState 연결
  - user-repos-content.tsx 다크 테마 + LoadingState/ErrorState/EmptyState 연결
  - commit-search-form / daily-summary-form / user-repo-search-form 인풋/버튼 다크 테마
  - back-button 다크 테마
  - page.tsx 3개 Suspense fallback → LoadingState 교체
  - next build 성공 (에러 0건)
- **Sprint 3**: Day 2 완료 ✅ (2026-03-04, branch: main)
  - hooks(use-commits/use-user-repos/use-daily-summary)에 refreshKey 파라미터 추가
  - commits/daily-summary/user-repos ErrorState에 onRetry 연결 (재시도 버튼 활성화)
  - CommitCard 커밋 메시지 truncate 추가 (긴 텍스트 overflow 방지)
  - commit-search-form placeholder 한글화 ("저장소 (소유자/레포명)"), limit 기본값 0
  - daily-summary-form placeholder 한글화
  - next build 성공 (에러 0건)

### 계획 문서 (주의: .omc/는 .gitignore 대상)
- MASTER_PLAN.md: .omc/plans/MASTER_PLAN.md
- WBS.md: .omc/plans/WBS.md
- SPRINT_PLAN.md (Sprint 1): .omc/plans/SPRINT_PLAN.md
- SPRINT2_PLAN.md: .omc/plans/SPRINT2_PLAN.md
- SPRINT3_PLAN.md: .omc/plans/SPRINT3_PLAN.md

### UI/UX 산출물 경로
- 디자인 토큰: uiux_designer/design-tokens.md
- 컴포넌트 스펙 Day1: uiux_designer/component-specs-day1.md
- 컴포넌트 스펙 Day2: uiux_designer/component-specs-day2.md
- 컴포넌트 스펙 Day4: uiux_designer/component-specs-day4.md
- FE 핸드오프: uiux_designer/day1-handoff-for-fe.md
- Figma 플러그인: uiux_designer/figma-manifests/dayN-YYYY-MM-DD/

### 팀 구성 방법 (새 세션에서 재시작 시)
```
TeamCreate(team_name="mcp-server-team")
→ Agent(subagent_type="oh-my-claudecode:planner", name="pm")
→ Agent(subagent_type="oh-my-claudecode:designer", name="uiux")
→ Agent(subagent_type="oh-my-claudecode:executor", name="fe")
```

### 페르소나 경로
- PM: ..\persona\project_manager\AGENTS.md
- FE: ..\persona\frontend_developer\AGENTS.md
- UIUX: ..\persona\uiux_designer\AGENTS.md
- 공통 규칙: ..\persona\AGENTS.md

### 주요 규칙
- git push 자동 실행 금지 (사용자 승인 후 실행)
- main 직접 push 금지 → feature/* 브랜치 사용
- persona/uiux_designer/AGENTS.md 수정 금지 (재사용 템플릿)
- 프로젝트별 설정은 mcp-server/AGENTS.md에 작성
- uiux_designer day 작업 시 manifest 폴더에 manifest.json + code.js + ui.html 3개 파일을 같은 경로에 함께 생성
- Windows 동기화 없음 → Git repo에만 저장
