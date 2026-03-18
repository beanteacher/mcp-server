# MCP Server

업무 자동화를 위한 MCP(Model Context Protocol) 서버.
Claude 등 AI 에이전트가 GitHub, 메시지 발송, Java 에이전트 진단 등 업무 도구를 직접 호출할 수 있도록 지원한다.

---

## 구현된 MCP 도구

### GitHub
| 도구 | 설명 |
|------|------|
| `get_commits` | 저장소의 커밋 목록 조회 (작성자·브랜치 필터, 전체 조회 지원) |
| `get_user_repos` | GitHub 유저의 public 레포지토리 목록 조회 |
| `get_daily_summary` | 오늘 커밋된 변경사항을 Gemini AI로 분석해 작업 정리본 반환 |

### 메시지 발송
| 도구 | 설명 |
|------|------|
| `send_sms_tran_alarm` | SMS·RCS·알림톡 발송 요청을 DB에 적재 |

### Java 에이전트 진단
| 도구 | 설명 |
|------|------|
| `agent_analyze_config` | setting.cmd/sh, agent.conf, jdbc.conf 파싱 및 요약 |
| `agent_analyze_logs` | logs/ 디렉토리 스캔 — ERROR/WARN 분류 및 원인 추출 |
| `agent_diagnose` | 설정 + 로그 + 파일 존재 여부를 종합 분석해 이슈 및 권고 조치 반환 |
| `agent_test_db` | jdbc.conf 기반 실제 DB 연결 테스트 |
| `agent_insert_sample` | 지정 테이블에 샘플 메시지 INSERT (발송 테스트용) |

---

## agent_diagnose 탐지 항목

| category | 유형 | 설명 |
|----------|------|------|
| `DB_CONNECTION_FAILED` | 로그 | DB 연결 실패 감지 |
| `TABLE_NOT_FOUND` | 로그 | 테이블 없음 감지 |
| `RELAY_CONNECTION_FAILED` | 로그 | 릴레이 서버 연결 실패 감지 |
| `JVM_MEMORY` | 로그 | JVM 메모리 부족 감지 |
| `CLASSPATH_ERROR` | 로그 | 클래스 로드 실패 감지 (JAR 경로 오류 등) |
| `NO_ACTIVE_MESSAGE_TYPE` | 설정 | smsUse/lmsUse/mmsUse/kkoUse 모두 비활성 |
| `JAVA_HOME_MISSING` | 설정 | JAVA_HOME 미설정 |
| `UNKNOWN_DB_TYPE` | 설정 | DB 타입 판별 불가 |
| `JAVA_EXECUTABLE_NOT_FOUND` | 파일 | java.exe 경로 없음 |
| `JAR_NOT_FOUND` | 파일 | JAR_PATH의 jar 파일 없음 |
| `MAPPER_NOT_FOUND` | 파일 | mapper XML 파일 없음 |

---

## 실행

```bash
# 개발 (tsx로 직접 실행)
npx tsx mcp-stdio.ts
```

## 프로젝트 구조

```
mcp-stdio.ts          # 서버 진입점 (stdio transport)
tools.ts              # MCP 도구 스키마 정의
handler.ts            # 도구별 실행 로직
feature/
├── agent/            # Java 에이전트 진단
│   ├── agent.service.ts
│   ├── agent.dto.ts
│   └── parsers/
├── github/           # GitHub API 연동
└── message/          # 메시지 발송
```
