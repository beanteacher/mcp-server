import { NextRequest, NextResponse } from 'next/server';
import { getCommits, getTodayCommits, getCommitDetail, getUserRepos } from '@/lib/github';
import { analyzeDailyWork } from '@/lib/gemini';

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
      },
      required: ['repo'],
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
        arguments?: Record<string, string>;
      };

      try {
        if (name === 'get_commits') {
          const [owner, repoName] = args.repo.split('/');
          const commits = await getCommits(owner, repoName);
          const text = commits
            .map(
              (c) =>
                `${c.sha.slice(0, 7)} │ ${c.commit.author?.date?.slice(0, 10)} │ ${c.commit.message.split('\n')[0]}`,
            )
            .join('\n');
          return respond({ content: [{ type: 'text', text }] });
        }

        if (name === 'get_user_repos') {
          const repos = await getUserRepos(args.username);
          const text = repos
            .map(
              (r) =>
                `${r.name} │ ${r.language ?? '-'} │ ⭐${r.stargazers_count} │ ${r.updated_at.slice(0, 10)} │ ${r.description ?? ''}`,
            )
            .join('\n');
          return respond({ content: [{ type: 'text', text }] });
        }

        if (name === 'get_daily_summary') {
          const [owner, repoName] = args.repo.split('/');
          const todayCommits = await getTodayCommits(owner, repoName);
          if (todayCommits.length === 0) {
            return respond({
              content: [{ type: 'text', text: '오늘 커밋 내역이 없습니다.' }],
            });
          }
          const details = await Promise.all(
            todayCommits.slice(0, 10).map((c) => getCommitDetail(owner, repoName, c.sha)),
          );
          const summary = await analyzeDailyWork(args.repo, details, args.model);
          return respond({ content: [{ type: 'text', text: summary }] });
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
