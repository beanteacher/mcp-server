# MCP Tools Dashboard - AI 에이전트 작업 가이드

## 프로젝트 개요

- **프로젝트명**: MCP Tools Dashboard
- **GitHub 주소**: https://github.com/beanteacher/mcp-server
- **저장소 공개 범위**: Public

### 프로젝트 설명
GitHub MCP 도구들을 하나의 대시보드에서 관리하고, Gemini AI 기반 분석 기능을 제공하는 웹 애플리케이션.
MCP(Model Context Protocol) JSON-RPC 엔드포인트를 통해 외부 AI 클라이언트와 연동 가능.

---

## 로컬 작업 디렉토리

```
C:\Users\wisecan\Desktop\min\workspace\mcp-server
```

---

## 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| **Framework** | Next.js (App Router) | 14.x |
| **언어** | TypeScript | 5.x |
| **스타일링** | Tailwind CSS | 3.x |
| **AI** | Google Gemini API | @google/generative-ai |
| **API** | GitHub REST API | - |
| **MCP** | JSON-RPC 2.0 | /api/mcp |

---

## Figma 링크

```
01. Design System : https://www.figma.com/design/CO3vH7wRPIYlAUXFVTiWaa/Design-System?node-id=0-1&p=f&t=mePYFYU7yuq6duPw-0
02. UX Design     : https://www.figma.com/design/Et6TOqpU0VrLUsTrAHjewP/UX-Design?t=qjJ3LZ5LYZC2cMmY-0
03. UI Design     : https://www.figma.com/design/02QfErcBAVxFBRnq0m5lVJ/UI-Design?node-id=9-2&p=f&t=8Xjznwb5QtR25kMW-0
```

---

## UI/UX 산출물 규칙 (이 프로젝트 전용)

- Figma manifest.json 저장: `mcp-server/uiux_designer/figma-manifests/dayN-YYYY-MM-DD/`
- **Windows 동기화 없음** — Git repo에만 저장
- persona/uiux_designer/AGENTS.md의 Windows 동기화 규칙은 이 프로젝트에서 적용하지 않음

---

## 전체 Git 규칙

### ⚠️ git push 자동 실행 절대 금지

모든 에이전트는 git push를 자동으로 실행하지 않는다.
push 전 반드시 사용자에게 보고하고 허가를 받는다.

### 커밋 메시지 컨벤션

```
<type>: <설명>
type: feat / fix / docs / style / refactor / test / chore / perf
```

### 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 릴리즈 브랜치 (직접 push 금지) |
| `develop` | 통합 개발 브랜치 |
| `feature/*` | 기능 개발 |

---

## 운영 플로우

1. **PM 선보고** — 스프린트/일차 목표 먼저 보고 후 Sub Agent 시작
2. **Sub Agent 실행** — PM 보고 이후에만 작업 시작
3. **일차 종료 보고** — 가장 중요한 작업 1개 + 산출물 경로

---

## 계획 문서 경로

```
.omc/plans/MASTER_PLAN.md    # 마스터 플랜 (Phase 1~3)
.omc/plans/WBS.md             # 작업 분해 구조
.omc/plans/SPRINT_PLAN.md     # 스프린트 계획
```
