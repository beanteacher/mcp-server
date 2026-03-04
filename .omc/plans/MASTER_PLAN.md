# MASTER PLAN - MCP Tools Dashboard

## 프로젝트 개요

**프로젝트명**: MCP Tools Dashboard
**목적**: GitHub MCP 도구들을 하나의 대시보드에서 관리하고, AI 기반 분석 기능을 제공하는 웹 애플리케이션
**스택**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Gemini API

---

## 최종 목표 및 KPI

| 목표 | KPI | 측정 방법 |
|------|-----|-----------|
| 직관적인 대시보드 UI | 3개 핵심 도구에 3클릭 이내 접근 | 모든 도구 페이지 진입 경로 검증 |
| 일관된 디자인 시스템 | 디자인 토큰 100% 적용 (색상, 타이포, 간격) | globals.css + tailwind.config 토큰 커버리지 |
| 반응형 레이아웃 | mobile(360px), tablet(768px), desktop(1280px) 정상 렌더링 | 3개 뷰포트 스크린샷 검증 |
| 페이지 완성도 | 모든 페이지 에러 0건, 빈 화면 0건 | next build 성공 + 각 페이지 수동 검증 |
| 코드 품질 | TypeScript strict 모드 에러 0건 | tsc --noEmit 통과 |

---

## MVP 범위 vs 비MVP 범위

### MVP (Sprint 1~2 범위)

| 항목 | 설명 |
|------|------|
| 디자인 시스템 구축 | 색상 팔레트, 타이포그래피, 간격, 라운딩, 그림자 토큰 정의 |
| 홈 대시보드 리디자인 | 도구 카드 비주얼 개선, 헤더/네비게이션 정비 |
| 커밋 타임라인 UI 개선 | CommitCard 비주얼, 날짜 구분선, 로딩/에러 상태 |
| 일일 요약 페이지 UI 개선 | AI 분석 결과 표시 레이아웃, 로딩 상태 |
| 유저 레포지토리 페이지 완성 | 검색 UX, 레포 카드 디자인, 빈 상태/에러 상태 |
| 공통 컴포넌트 | Header, Navigation, LoadingState, ErrorState, EmptyState |
| 반응형 대응 | mobile/tablet/desktop 3단 반응형 |

### 비MVP (Sprint 3 이후)

| 항목 | 설명 |
|------|------|
| 다크 모드 | 라이트/다크 테마 전환 |
| 새 MCP 도구 추가 | 추가 도구 카드 및 페이지 |
| 사용자 인증 | GitHub OAuth 로그인 |
| 알림 시스템 | 커밋/이벤트 실시간 알림 |
| 미사용 의존성 제거 | @anthropic-ai/sdk 정리 |
| 애니메이션/트랜지션 | 페이지 전환, 카드 인터랙션 효과 |
| 테스트 코드 | 단위/통합 테스트 작성 |

---

## 마일스톤

### Phase 1: 디자인 시스템 + 공통 UI (Day 1~3)
- 디자인 토큰 정의 (색상, 타이포, 간격, 그림자)
- tailwind.config.ts 확장
- globals.css 리셋 및 기본 스타일
- 공통 컴포넌트: Header, Navigation, LoadingState, ErrorState, EmptyState
- 홈 대시보드 리디자인
- 완료기준: next build 성공, 디자인 토큰이 tailwind.config에 반영, 홈 페이지에 새 디자인 적용

### Phase 2: 개별 페이지 UI 고도화 (Day 4~6)
- 커밋 타임라인 페이지 리디자인
- 일일 요약 페이지 리디자인
- 유저 레포지토리 페이지 UI 완성
- 반응형 레이아웃 전체 적용
- 완료기준: 3개 페이지 모두 새 디자인 적용, 360px/768px/1280px 뷰포트에서 레이아웃 깨짐 없음

### Phase 3: 품질 마무리 (Day 7~8)
- TypeScript strict 모드 에러 해결
- 크로스 페이지 네비게이션 검증
- 에지 케이스 처리 (빈 데이터, 네트워크 에러, 긴 텍스트 등)
- 미사용 코드/의존성 정리
- 완료기준: tsc --noEmit 에러 0건, next build 성공, 모든 페이지 에러 상태 처리 완료

---

## 핵심 리스크

| 리스크 | 영향도 | 완화 방안 |
|--------|--------|-----------|
| Tailwind 커스텀 토큰과 기존 코드 충돌 | 중 | 기존 유틸리티 클래스를 점진적으로 교체, 한 페이지씩 마이그레이션 |
| layout.tsx와 layout.jsx 중복 존재 | 고 | Sprint 1에서 즉시 정리 (layout.jsx 제거 또는 통합) |
| GitHub API Rate Limit | 중 | 개발 중 목 데이터 활용, 에러 핸들링 강화 |
| Gemini API 키 미설정 시 빌드 실패 | 중 | 환경변수 없을 때 폴백 UI 표시 |
| 반응형 레이아웃 복잡도 | 저 | Tailwind 기본 브레이크포인트 활용, 커스텀 미디어 쿼리 최소화 |
