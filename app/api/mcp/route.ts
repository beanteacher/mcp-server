import { NextRequest, NextResponse } from 'next/server';
import { getCommits, getAllCommits, getTodayCommits, getCommitDetail, getUserRepos } from '@/feature/github/service';
import { analyzeDailyWork } from '@/lib/gemini';
import { enqueueTranAlarm } from '@/feature/message/service';
import { analyzeConfig, analyzeLogs, diagnose, testDb, insertSample } from '@/feature/agent/agent.service';

const TOOLS = [
  {
    name: 'get_commits',
    description: 'GitHub 저장소의 최근 커밋 목록을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'owner/repo 형식 (예: vercel/next.js)',
        },
        limit: {
          type: 'number',
          description: '가져올 커밋 수 (기본값: 30, 0 입력 시 전체 조회)',
        },
        author: {
          type: 'string',
          description: '특정 작성자의 커밋만 조회 (GitHub 유저명 또는 이메일)',
        },
        branch: {
          type: 'string',
          description: '조회할 브랜치명 (미입력 시 기본 브랜치)',
        },
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
        username: {
          type: 'string',
          description: 'GitHub 유저명 (예: beanteacher)',
        },
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
        repo: {
          type: 'string',
          description: 'owner/repo 형식',
        },
        model: {
          type: 'string',
          description: '사용할 Gemini 모델 ID (기본값: models/gemini-2.5-flash)',
        },
        branch: {
          type: 'string',
          description: '분석할 브랜치명 (미입력 시 기본 브랜치)',
        },
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
        channel: {
          type: 'string',
          enum: ['sms', 'rcs', 'atalk'],
          description: '발송 채널 (sms | rcs | atalk)',
        },
        msgSubType: {
          type: 'string',
          description: '메시지 세부 유형 (최대 5자)',
        },
        destaddr: {
          type: 'string',
          description: '착신 번호',
        },
        callback: {
          type: 'string',
          description: '회신 번호 (미입력 시 MCP_TRAN_DEFAULT_CALLBACK 사용)',
        },
        sendMsg: {
          type: 'string',
          description: '메시지 본문 (최대 300자)',
        },
        userId: {
          type: 'string',
          description: '발송 사용자 ID (미입력 시 MCP_TRAN_DEFAULT_USER_ID 사용)',
        },
        kisaCode: {
          type: 'string',
          description: 'KISA 식별 코드 (미입력 시 MCP_TRAN_DEFAULT_KISA_CODE 사용)',
        },
        billCode: {
          type: 'string',
          description: '과금 코드 (미입력 시 MCP_TRAN_DEFAULT_BILL_CODE 사용)',
        },
        groupId: {
          type: 'string',
          description: '그룹 ID (정수 문자열)',
        },
        requestDate: {
          type: 'string',
          description: '전송 희망 일시(ISO 8601), 미입력 시 현재 시각',
        },
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
];

type JsonRpcId = string | number | null;

function jsonOk(id: JsonRpcId, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result });
}

function jsonErr(id: JsonRpcId, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } });
}

// SSE 스트림 응답 (Claude가 Accept: text/event-stream 요청 시)
function sseOk(id: JsonRpcId, result: unknown) {
  const data = JSON.stringify({ jsonrpc: '2.0', id, result });
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}

function readRequiredString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key}는 필수 문자열입니다.`);
  }

  return value.trim();
}

function readOptionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${key}는 문자열이어야 합니다.`);
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readNumber(args: Record<string, unknown>, key: string, fallback: number): number {
  const value = args[key];
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${key}는 숫자여야 합니다.`);
  }

  return parsed;
}

export async function POST(req: NextRequest) {
  const useSSE = req.headers.get('accept')?.includes('text/event-stream') ?? false;

  let body: { method: string; params?: Record<string, unknown>; id?: JsonRpcId };
  try {
    body = await req.json();
  } catch {
    return jsonErr(null, -32700, 'Parse error');
  }

  const { method, params, id } = body;

  // id 없는 요청은 Notification — 응답 불필요
  if (id === undefined) {
    return new NextResponse(null, { status: 204 });
  }

  const respond = (result: unknown) =>
    useSSE ? sseOk(id, result) : jsonOk(id, result);

  switch (method) {
    case 'initialize':
      return respond({
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'github-mcp-server', version: '0.1.0' },
      });

    case 'ping':
      return respond({});

    case 'tools/list':
      return respond({ tools: TOOLS });

    case 'tools/call': {
      const { name, arguments: args = {} } = params as {
        name: string;
        arguments?: Record<string, unknown>;
      };

      try {
        if (name === 'get_commits') {
          const repo = readRequiredString(args, 'repo');
          const [owner, repoName] = repo.split('/');
          const limit = readNumber(args, 'limit', 30);
          const author = readOptionalString(args, 'author');
          const branch = readOptionalString(args, 'branch');
          const commits = limit === 0
            ? await getAllCommits(owner, repoName, author, branch)
            : await getCommits(owner, repoName, limit, author, branch);
          const text = commits
            .map(
              (c) =>
                `${c.sha.slice(0, 7)} │ ${c.commit.author?.date?.slice(0, 10)} │ ${c.commit.message.split('\n')[0]}`,
            )
            .join('\n');
          return respond({ content: [{ type: 'text', text }] });
        }

        if (name === 'get_user_repos') {
          const username = readRequiredString(args, 'username');
          const repos = await getUserRepos(username);
          const text = repos
            .map(
              (r) =>
                `${r.name} │ ${r.language ?? '-'} │ ⭐${r.stargazers_count} │ ${r.updated_at.slice(0, 10)} │ ${r.description ?? ''}`,
            )
            .join('\n');
          return respond({ content: [{ type: 'text', text }] });
        }

        if (name === 'get_daily_summary') {
          const repo = readRequiredString(args, 'repo');
          const [owner, repoName] = repo.split('/');
          const branch = readOptionalString(args, 'branch');
          const todayCommits = await getTodayCommits(owner, repoName, branch);
          if (todayCommits.length === 0) {
            return respond({
              content: [{ type: 'text', text: '오늘 커밋 내역이 없습니다.' }],
            });
          }
          const details = await Promise.all(
            todayCommits.slice(0, 10).map((c) => getCommitDetail(owner, repoName, c.sha)),
          );
          const summary = await analyzeDailyWork(repo, details, readOptionalString(args, 'model'));
          return respond({ content: [{ type: 'text', text: summary }] });
        }

        if (name === 'send_sms_tran_alarm') {
          const result = await enqueueTranAlarm({
            channel: readRequiredString(args, 'channel') as 'sms' | 'rcs' | 'atalk',
            msgSubType: readRequiredString(args, 'msgSubType'),
            destaddr: readRequiredString(args, 'destaddr'),
            callback: readOptionalString(args, 'callback'),
            sendMsg: readRequiredString(args, 'sendMsg'),
            userId: readOptionalString(args, 'userId'),
            kisaCode: readOptionalString(args, 'kisaCode'),
            billCode: readOptionalString(args, 'billCode'),
            groupId: readOptionalString(args, 'groupId'),
            requestDate: readOptionalString(args, 'requestDate'),
          });

          const text = [
            'send_sms_tran_alarm 적재 성공',
            `msg_id: ${result.msgId}`,
            `msg_type: ${result.msgType}`,
            `msg_sub_type: ${result.msgSubType}`,
            `destaddr: ${result.destaddr}`,
            `request_date: ${result.requestDate}`,
          ].join('\n');

          return respond({ content: [{ type: 'text', text }] });
        }

        if (name === 'agent_analyze_config') {
          const agentHome = readRequiredString(args, 'agentHome');
          const os = readOptionalString(args, 'os') as 'windows' | 'linux' | undefined;
          const result = await analyzeConfig(agentHome, os);
          return respond({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
        }

        if (name === 'agent_analyze_logs') {
          const agentHome = readRequiredString(args, 'agentHome');
          const result = await analyzeLogs(agentHome);
          return respond({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
        }

        if (name === 'agent_diagnose') {
          const agentHome = readRequiredString(args, 'agentHome');
          const os = readOptionalString(args, 'os') as 'windows' | 'linux' | undefined;
          const result = await diagnose(agentHome, os);
          return respond({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
        }

        if (name === 'agent_test_db') {
          const agentHome = readRequiredString(args, 'agentHome');
          const result = await testDb(agentHome);
          const lines = [
            `dbType: ${result.dbType}`,
            `url: ${result.url}`,
            `connected: ${result.connected}`,
            `elapsedMs: ${result.elapsedMs}`,
            ...(result.error ? [`error: ${result.error}`] : []),
          ];
          return respond({ content: [{ type: 'text', text: lines.join('\n') }] });
        }

        if (name === 'agent_insert_sample') {
          const agentHome = readRequiredString(args, 'agentHome');
          const result = await insertSample(agentHome, {
            messageType: readOptionalString(args, 'messageType'),
            destaddr: readOptionalString(args, 'destaddr'),
            sendMsg: readOptionalString(args, 'sendMsg'),
            count: args['count'] !== undefined ? readNumber(args, 'count', 1) : undefined,
          });
          const lines = [
            `tableName: ${result.tableName}`,
            `insertedCount: ${result.insertedCount}`,
            `insertedPks: ${result.insertedPks.join(', ')}`,
          ];
          return respond({ content: [{ type: 'text', text: lines.join('\n') }] });
        }

        return jsonErr(id, -32602, `Unknown tool: ${name}`);
      } catch (e) {
        const message = e instanceof Error ? e.message : '도구 실행 중 오류';
        return respond({
          content: [{ type: 'text', text: `오류: ${message}` }],
          isError: true,
        });
      }
    }

    default:
      return jsonErr(id, -32601, `Method not found: ${method}`);
  }
}
