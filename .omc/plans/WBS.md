# WBS (Work Breakdown Structure) - MCP Tools Dashboard

## 범례

- **담당**: PM(Project Manager), FE(Frontend Developer), UIUX(UI/UX Designer)
- **의존성**: 해당 작업 시작 전 완료되어야 하는 작업 번호
- **DoD**: Definition of Done (완료기준)

---

## Figma 파일 URL

| 파일 | URL |
|------|-----|
| 01. Design System | https://www.figma.com/design/CO3vH7wRPIYlAUXFVTiWaa/Design-System?node-id=0-1&p=f&t=mePYFYU7yuq6duPw-0 |
| 02. UX Design | https://www.figma.com/design/Et6TOqpU0VrLUsTrAHjewP/UX-Design?t=qjJ3LZ5LYZC2cMmY-0 |
| 03. UI Design | https://www.figma.com/design/02QfErcBAVxFBRnq0m5lVJ/UI-Design?node-id=9-2&p=f&t=8Xjznwb5QtR25kMW-0 |

---

## UIUX 산출물 형태

모든 UIUX 작업은 아래 3가지 산출물을 생성한다:

1. **마크다운 스펙 문서** - FE에 전달할 컴포넌트 스펙 (기존 유지)
2. **Figma 플러그인 manifest.json** - Figma 프레임 자동 생성용 플러그인 코드
   - 저장 경로: `mcp-server/uiux_designer/figma-manifests/dayN-YYYY-MM-DD/manifest.json`
   - Windows 동기화 없음
3. **Figma 파일 반영** - 위 URL의 파일에 프레임/컴포넌트 실제 생성

---

## 1. 디자인 시스템 기반 구축

| # | 작업 | 담당 | 의존성 | DoD |
|---|------|------|--------|-----|
| 1.1 | 디자인 토큰 정의 (색상 팔레트, 타이포그래피 스케일, 간격 스케일, 라운딩, 그림자) | UIUX | 없음 | 디자인 토큰 문서에 primary/secondary/accent/neutral/semantic 색상, 4단계 폰트 사이즈, 8px 기반 간격 스케일 명시. Figma Design System 파일에 토큰 프레임 존재. manifest.json이 `mcp-server/uiux_designer/figma-manifests/day1-2026-03-04/`에 저장 |
| 1.2 | tailwind.config.ts 토큰 반영 | FE | 1.1 | tailwind.config.ts의 theme.extend에 1.1의 모든 토큰이 키-값으로 등록, `npx tailwindcss --help` 정상 실행 |
| 1.3 | globals.css 기본 스타일 정의 | FE | 1.2 | CSS 리셋, 기본 타이포 적용, body/html 기본 스타일 설정 완료 |
| 1.4 | layout.tsx/layout.jsx 중복 해결 | FE | 없음 | layout.jsx 제거, layout.tsx만 존재, `next build` 성공 |

---

## 2. 공통 컴포넌트

| # | 작업 | 담당 | 의존성 | DoD |
|---|------|------|--------|-----|
| 2.1 | Header 컴포넌트 스펙 | UIUX | 1.1 | 로고, 네비게이션 링크 위치, 반응형 동작(mobile: 햄버거 or 간소화) 명시. Figma UI Design 파일에 Header 프레임 존재. manifest.json이 `mcp-server/uiux_designer/figma-manifests/day1-2026-03-04/`에 저장 |
| 2.2 | Header 컴포넌트 구현 | FE | 2.1, 1.2 | components/Header.tsx 생성, layout.tsx에서 기존 header 태그를 Header 컴포넌트로 교체, 디자인 토큰 사용 |
| 2.3 | Navigation 컴포넌트 스펙 | UIUX | 1.1 | 현재 페이지 활성 표시, 3개 도구 링크, 홈 링크 포함. Figma UI Design 파일에 Navigation 프레임 존재. manifest.json이 `mcp-server/uiux_designer/figma-manifests/day1-2026-03-04/`에 저장 |
| 2.4 | Navigation 컴포넌트 구현 | FE | 2.3, 1.2 | components/Navigation.tsx 생성, 현재 경로 기반 활성 상태 표시, Next.js Link 사용 |
| 2.5 | 상태 컴포넌트 스펙 (Loading, Error, Empty) | UIUX | 1.1 | 3가지 상태 각각의 아이콘/메시지/레이아웃 명시. Figma UI Design 파일에 상태 컴포넌트 프레임 존재. manifest.json이 `mcp-server/uiux_designer/figma-manifests/day1-2026-03-04/`에 저장 |
| 2.6 | 상태 컴포넌트 구현 | FE | 2.5, 1.2 | components/LoadingState.tsx, components/ErrorState.tsx, components/EmptyState.tsx 생성 |

---

## 3. 홈 대시보드

| # | 작업 | 담당 | 의존성 | DoD |
|---|------|------|--------|-----|
| 3.1 | 홈 대시보드 리디자인 스펙 | UIUX | 1.1 | 도구 카드 레이아웃, 카드 hover 효과, 그리드 간격, 모바일 배치 명시. Figma UI Design 파일에 홈 대시보드 프레임 존재. manifest.json이 `mcp-server/uiux_designer/figma-manifests/day2-2026-03-05/`에 저장 |
| 3.2 | McpToolCard 리디자인 | FE | 3.1, 1.2 | McpToolCard.tsx에 새 디자인 토큰 적용, 아이콘/제목/설명 비주얼 개선 |
| 3.3 | 홈 페이지 레이아웃 업데이트 | FE | 3.2, 2.2 | app/page.tsx에서 새 Header, 새 카드 디자인 적용, "도구 추가 예정" 플레이스홀더 스타일 통일 |

---

## 4. 커밋 타임라인 페이지

| # | 작업 | 담당 | 의존성 | DoD |
|---|------|------|--------|-----|
| 4.1 | 커밋 타임라인 리디자인 스펙 | UIUX | 1.1 | 타임라인 선 스타일, 커밋 카드 레이아웃, 날짜 구분 헤더, 로딩/에러 상태 명시. Figma UI Design 파일에 커밋 타임라인 프레임 존재. manifest.json이 해당 일차 디렉토리에 저장 |
| 4.2 | CommitCard 리디자인 | FE | 4.1, 1.2 | CommitCard.tsx에 새 디자인 적용, sha/author/시간 표시 스타일 통일 |
| 4.3 | 커밋 페이지 레이아웃 업데이트 | FE | 4.2, 2.6 | app/commits/page.tsx에 LoadingState, ErrorState 적용, 날짜 구분 헤더 스타일 개선 |

---

## 5. 일일 요약 페이지

| # | 작업 | 담당 | 의존성 | DoD |
|---|------|------|--------|-----|
| 5.1 | 일일 요약 리디자인 스펙 | UIUX | 1.1 | AI 분석 결과 카드 레이아웃, 로딩 인디케이터, 에러 상태, 빈 상태 명시. Figma UI Design 파일에 일일 요약 프레임 존재. manifest.json이 해당 일차 디렉토리에 저장 |
| 5.2 | 일일 요약 페이지 UI 구현 | FE | 5.1, 2.6, 1.2 | app/daily-summary/page.tsx에 새 디자인 적용, 공통 상태 컴포넌트 사용 |

---

## 6. 유저 레포지토리 페이지

| # | 작업 | 담당 | 의존성 | DoD |
|---|------|------|--------|-----|
| 6.1 | 유저 레포지토리 리디자인 스펙 | UIUX | 1.1 | 검색 폼 스타일, 레포 카드 레이아웃, 언어 뱃지, 스타 표시, 빈/에러 상태 명시. Figma UI Design 파일에 유저 레포지토리 프레임 존재. manifest.json이 해당 일차 디렉토리에 저장 |
| 6.2 | 유저 레포지토리 페이지 UI 구현 | FE | 6.1, 2.6, 1.2 | app/user-repos/page.tsx 리디자인, 검색 폼 UX 개선, 공통 상태 컴포넌트 사용 |

---

## 7. 반응형 및 품질

| # | 작업 | 담당 | 의존성 | DoD |
|---|------|------|--------|-----|
| 7.1 | 반응형 브레이크포인트 가이드 | UIUX | 1.1 | 360px(mobile), 768px(tablet), 1280px(desktop) 각각의 레이아웃 변화 규칙 명시. Figma UX Design 파일에 반응형 가이드 프레임 존재 |
| 7.2 | 전 페이지 반응형 적용 | FE | 7.1, 3.3, 4.3, 5.2, 6.2 | 모든 페이지에서 3개 뷰포트 레이아웃 정상 렌더링 |
| 7.3 | TypeScript 에러 해결 | FE | 3.3, 4.3, 5.2, 6.2 | `tsc --noEmit` 에러 0건 |
| 7.4 | 빌드 검증 | FE | 7.2, 7.3 | `next build` 성공, 빌드 에러 0건 |

---

## Figma manifest 저장 경로 규칙

- Git 아카이브 경로: `mcp-server/uiux_designer/figma-manifests/dayN-YYYY-MM-DD/manifest.json`
- Windows 동기화: 제외 (Figma 데스크톱 import 필요 시에만 수동 수행)
- manifest.json은 덮어쓰지 않고 일차별 아카이브

---

## 의존성 다이어그램 (핵심 경로)

```
1.1 (UIUX: 토큰 + Figma DS) ─┬─> 1.2 (FE: tailwind) ──> 1.3 (FE: globals.css)
                               │
                               ├─> 2.1 (UIUX: Header + Figma) ────> 2.2 (FE: Header)
                               ├─> 2.3 (UIUX: Nav + Figma) ───────> 2.4 (FE: Nav)
                               ├─> 2.5 (UIUX: 상태 + Figma) ──────> 2.6 (FE: 상태)
                               │
                               ├─> 3.1 (UIUX: 홈 + Figma) ────────> 3.2, 3.3 (FE)
                               ├─> 4.1 (UIUX: 커밋 + Figma) ──────> 4.2, 4.3 (FE)
                               ├─> 5.1 (UIUX: 요약 + Figma) ──────> 5.2 (FE)
                               └─> 6.1 (UIUX: 레포 + Figma) ──────> 6.2 (FE)

                               7.2 (반응형) ──> 7.4 (빌드 검증)
                               7.3 (TS 에러) ─┘
```

**크리티컬 패스**: 1.1 -> 1.2 -> 2.2/2.4/2.6 -> 3.3/4.3/5.2/6.2 -> 7.2 -> 7.4
