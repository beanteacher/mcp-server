# MCP Server - Agent 진단 도구 개발

## 중요 규칙
> **매 작업 세션이 끝날 때마다 반드시 이 파일의 "작업 현황" 섹션을 업데이트할 것.**
> context clear 후 새 세션에서도 이 파일을 읽고 이어서 작업할 수 있도록 진행 상황을 상세히 기록한다.

---

## 프로젝트 개요

Java 기반 메시지 에이전트(NITSOFT 등) 운영자를 위한 MCP 진단 도구 서버.
운영자가 에이전트 실행 후 문제가 생겼을 때 원인 파악과 테스트를 보조한다.

**설계 문서**: `C:\Users\wisecan\.claude\plans\generic-soaring-cascade.md`

---

## 전체 구현 계획

| Phase | 작업 | 파일 | 상태 |
|-------|------|------|------|
| 1 | 파서 4개 + DTO 구현 | `feature/agent/agent.dto.ts`, `feature/agent/parsers/*.ts` | ✅ 완료 |
| 2 | `agent_analyze_config` | `feature/agent/agent.service.ts` (analyzeConfig) | ✅ 완료 |
| 3 | `agent_analyze_logs` | `feature/agent/agent.service.ts` (analyzeLogs) | ✅ 완료 |
| 4 | `agent_diagnose` | `feature/agent/agent.service.ts` (diagnose) | ✅ 완료 |
| 5 | `agent_test_db` + 의존성 | `feature/agent/agent.service.ts` (testDb), `package.json` | ✅ 완료 |
| 6 | `agent_insert_sample` | `feature/agent/agent.service.ts` (insertSample) | ✅ 완료 |
| 7 | route.ts 도구 등록 | `app/api/mcp/route.ts` | ✅ 완료 |

---

## 작업 현황

### ✅ Phase 1 완료 (2026-03-18)

**생성된 파일:**
- `feature/agent/agent.dto.ts` — AgentDto 네임스페이스: SettingResult, AgentConfResult, JdbcConfResult, ConfigResult, LogEntry, LogResult
- `feature/agent/parsers/setting-cmd.parser.ts` — Windows `SET 변수명=값` 파싱, `%변수명%` 참조 resolve
- `feature/agent/parsers/setting-sh.parser.ts` — Linux `export 변수명=값` 파싱, `$변수명` 참조 resolve
- `feature/agent/parsers/agent-conf.parser.ts` — `conf/agent.conf` key=value 파싱
- `feature/agent/parsers/jdbc-conf.parser.ts` — `conf/jdbc.conf` 파싱 + DB 타입 자동 판별

**커밋:** `36bb1ee` (feat: message 발송 MCP 도구 및 Prisma 연동 추가 — Phase 1 이전 작업 포함)

---

### ✅ Phase 2 완료 (2026-03-18)

**생성된 파일:**
- `feature/agent/agent.service.ts` — `analyzeConfig(agentHome, os?)` 구현
  - `bin_win/` / `bin_linux/` 폴더 감지로 OS 자동 판별
  - 파서 4개 병렬 호출 (`Promise.all`)
  - `smsUse/lmsUse/mmsUse/kkoUse === 'Y'` 필터로 `activeMessageTypes` 산출
  - `jdbcConf.password` → `'****'` 마스킹

---

### ✅ Phase 3 완료 (2026-03-18)

**수정된 파일:**
- `feature/agent/agent.service.ts` — `analyzeLogs(agentHome)` 구현
  - `readline` 스트리밍으로 `logs/*.log` 파일 파싱
  - `ERROR` / `WARN` 라인 추출
  - `classifyLine()` 정규식으로 5개 카테고리 분류
    - `DB_CONNECTION_FAILED`: Communications link failure, ORA-, Cannot open database 등
    - `TABLE_NOT_FOUND`: Table doesn't exist, ORA-00942 등
    - `RELAY_CONNECTION_FAILED`: relay + socket/Connection refused 등
    - `JVM_MEMORY`: OutOfMemoryError, GC overhead limit exceeded
    - `UNKNOWN`: 분류 불가
  - `logs/` 디렉토리 없으면 빈 결과 반환
  - 파일 병렬 파싱 (`Promise.all`) + 카테고리별 `summary` 집계

---

### ✅ Phase 4 완료 (2026-03-18)

**수정된 파일:**
- `feature/agent/agent.dto.ts` — `DiagnoseIssue`, `DiagnoseResult` 인터페이스 추가
- `feature/agent/agent.service.ts` — `diagnose(agentHome, os?)` 구현
  - `analyzeConfig` + `analyzeLogs` 병렬 호출 (`Promise.all`)
  - 로그 기반 진단 4종: `DB_CONNECTION_FAILED`, `TABLE_NOT_FOUND`, `RELAY_CONNECTION_FAILED`, `JVM_MEMORY`
  - 설정 기반 진단 3종: `NO_ACTIVE_MESSAGE_TYPE`, `JAVA_HOME_MISSING`, `UNKNOWN_DB_TYPE`
  - `healthy`: ERROR 이슈가 없을 때 true

---

### ✅ Phase 5 완료 (2026-03-18)

**수정된 파일:**
- `feature/agent/agent.dto.ts` — `DbTestResult`, `InsertSampleResult` 인터페이스 추가
- `feature/agent/agent.service.ts` — `parseJdbcUrl()` 헬퍼 + `testDb(agentHome)` 구현
  - JDBC URL → Node.js 연결 파라미터 변환 (MySQL/MariaDB/MSSQL/Oracle/Tibero)
  - mysql/mariadb: `mysql2/promise` 동적 import, 5초 타임아웃
  - mssql: `mssql` 동적 import, trustServerCertificate
  - oracle: "oracledb 설치 필요" 안내 반환
  - tibero: "드라이버 미지원" 안내 반환
- `package.json` — `mysql2 ^3.20.0`, `mssql ^11.0.1`, `@types/mssql ^9.1.9` 추가

---

### ✅ Phase 6 완료 (2026-03-18)

**수정된 파일:**
- `feature/agent/agent.service.ts` — `insertSample(agentHome, opts?)` 구현
  - messageType(sms/lms/mms/kko)별 테이블명 결정 (agent.conf 기반)
  - count 최대 10건 제한
  - MySQL/MariaDB: prepared statement INSERT (`destaddr, sendmsg, stat, reg_date`)
  - MSSQL: named parameter INSERT + `SCOPE_IDENTITY()` PK 반환
  - 삽입된 PK 목록 반환

---

### ✅ Phase 7 완료 (2026-03-18)

**수정된 파일:**
- `app/api/mcp/route.ts` — 5개 도구 등록 완료
  - TOOLS 배열에 `agent_analyze_config`, `agent_analyze_logs`, `agent_diagnose`, `agent_test_db`, `agent_insert_sample` 추가
  - `tools/call` switch에 각 도구 핸들러 추가
  - import: `analyzeConfig, analyzeLogs, diagnose, testDb, insertSample`

**타입체크:** `npm run typecheck` 오류 없음 ✅

---

## 🎉 전체 구현 완료

모든 Phase(1~7) 완료. 5개 MCP 도구 모두 등록됨.

---

## 아키텍처 참고

```
feature/agent/
├── agent.dto.ts                    # 타입 정의
├── agent.service.ts                # 서비스 로직 (Phase 2~6에서 채워나감)
└── parsers/
    ├── setting-cmd.parser.ts
    ├── setting-sh.parser.ts
    ├── agent-conf.parser.ts
    └── jdbc-conf.parser.ts

app/api/mcp/route.ts                # Phase 7에서 도구 등록
```

**추가할 MCP 도구 5종:**
| 도구명 | 함수 |
|--------|------|
| `agent_analyze_config` | analyzeConfig() |
| `agent_analyze_logs` | analyzeLogs() |
| `agent_diagnose` | diagnose() |
| `agent_test_db` | testDb() |
| `agent_insert_sample` | insertSample() |

**Phase 5에서 추가할 npm 의존성:**
- `mysql2` — MySQL/MariaDB 연결 테스트 및 INSERT
- `mssql` — MS-SQL 연결 테스트 및 INSERT
- `oracledb` — Oracle (optional)
