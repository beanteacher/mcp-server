export const TOOLS = [
  {
    name: 'get_commits',
    description: 'GitHub 저장소의 최근 커밋 목록을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'owner/repo 형식 (예: vercel/next.js)' },
        limit: { type: 'number', description: '가져올 커밋 수 (기본값: 30, 0 입력 시 전체 조회)' },
        author: { type: 'string', description: '특정 작성자의 커밋만 조회 (GitHub 유저명 또는 이메일)' },
        branch: { type: 'string', description: '조회할 브랜치명 (미입력 시 기본 브랜치)' },
      },
      required: ['repo'],
    },
  },
  {
    name: 'get_user_repos',
    description: 'GitHub 유저의 public 레포지토리 목록을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'GitHub 유저명 (예: beanteacher)' },
      },
      required: ['username'],
    },
  },
  {
    name: 'get_daily_summary',
    description: '오늘 커밋된 변경사항을 Gemini AI로 분석해 작업 정리본을 반환합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'owner/repo 형식' },
        model: { type: 'string', description: '사용할 Gemini 모델 ID (기본값: models/gemini-2.5-flash)' },
        branch: { type: 'string', description: '분석할 브랜치명 (미입력 시 기본 브랜치)' },
      },
      required: ['repo'],
    },
  },
  {
    name: 'send_sms_tran_alarm',
    description: '문자/SMS, RCS, 알림톡 발송을 위해 send_sms_tran_alarm 테이블에 전송 요청을 적재합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', enum: ['sms', 'rcs', 'atalk'], description: '발송 채널 (sms | rcs | atalk)' },
        msgSubType: { type: 'string', description: '메시지 세부 유형 (최대 5자)' },
        destaddr: { type: 'string', description: '착신 번호' },
        callback: { type: 'string', description: '회신 번호' },
        sendMsg: { type: 'string', description: '메시지 본문 (최대 300자)' },
        userId: { type: 'string', description: '발송 사용자 ID' },
        kisaCode: { type: 'string', description: 'KISA 식별 코드' },
        billCode: { type: 'string', description: '과금 코드' },
        groupId: { type: 'string', description: '그룹 ID (정수 문자열)' },
        requestDate: { type: 'string', description: '전송 희망 일시(ISO 8601)' },
      },
      required: ['channel', 'msgSubType', 'destaddr', 'sendMsg'],
    },
  },
  {
    name: 'agent_analyze_config',
    description: '에이전트 설정 파일(setting.cmd/sh, agent.conf, jdbc.conf)을 파싱해 요약합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        agentHome: { type: 'string', description: '에이전트 루트 경로' },
        os: { type: 'string', description: 'windows|linux (미입력 시 자동 감지)' },
      },
      required: ['agentHome'],
    },
  },
  {
    name: 'agent_analyze_logs',
    description: 'logs/ 디렉토리를 스캔해 ERROR/WARN 항목을 추출하고 분류합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        agentHome: { type: 'string', description: '에이전트 루트 경로' },
      },
      required: ['agentHome'],
    },
  },
  {
    name: 'agent_diagnose',
    description: '설정과 로그를 종합 분석해 문제 원인과 권고 조치를 반환합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        agentHome: { type: 'string', description: '에이전트 루트 경로' },
        os: { type: 'string', description: 'windows|linux (미입력 시 자동 감지)' },
      },
      required: ['agentHome'],
    },
  },
  {
    name: 'agent_test_db',
    description: 'jdbc.conf 정보를 기반으로 실제 DB 연결을 테스트합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        agentHome: { type: 'string', description: '에이전트 루트 경로' },
      },
      required: ['agentHome'],
    },
  },
  {
    name: 'agent_insert_sample',
    description: 'agent.conf 테이블명 기반으로 샘플 메시지를 INSERT해 발송 테스트를 지원합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        agentHome: { type: 'string', description: '에이전트 루트 경로' },
        messageType: { type: 'string', description: 'sms|lms|mms|kko (기본 sms)' },
        destaddr: { type: 'string', description: '수신 번호 (기본 01000000000)' },
        sendMsg: { type: 'string', description: "[테스트] 메시지 본문 (기본 '[테스트] 샘플 메시지')" },
        count: { type: 'number', description: '삽입 건수 (기본 1, 최대 10)' },
      },
      required: ['agentHome'],
    },
  },
] as const;
