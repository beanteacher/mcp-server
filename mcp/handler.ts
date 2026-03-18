import { getCommits, getAllCommits, getTodayCommits, getCommitDetail, getUserRepos } from '../feature/github/service';
import { analyzeDailyWork } from '../lib/gemini';
import { enqueueTranAlarm } from '../feature/message/service';
import { analyzeConfig, analyzeLogs, diagnose, testDb, insertSample } from '../feature/agent/service';

export async function handleTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'get_commits': {
      const repo = readRequiredString(args, 'repo');
      const [owner, repoName] = repo.split('/');
      const limit = readNumber(args, 'limit', 30);
      const author = readOptionalString(args, 'author');
      const branch = readOptionalString(args, 'branch');
      const commits = limit === 0
        ? await getAllCommits(owner, repoName, author, branch)
        : await getCommits(owner, repoName, limit, author, branch);
      return commits.map(c => `${c.sha.slice(0, 7)} │ ${c.commit.author?.date?.slice(0, 10)} │ ${c.commit.message.split('\n')[0]}`).join('\n');
    }

    case 'get_user_repos': {
      const repos = await getUserRepos(readRequiredString(args, 'username'));
      return repos.map(r => `${r.name} │ ${r.language ?? '-'} │ ⭐${r.stargazers_count} │ ${r.updated_at.slice(0, 10)} │ ${r.description ?? ''}`).join('\n');
    }

    case 'get_daily_summary': {
      const repo = readRequiredString(args, 'repo');
      const [owner, repoName] = repo.split('/');
      const todayCommits = await getTodayCommits(owner, repoName, readOptionalString(args, 'branch'));
      if (todayCommits.length === 0) return '오늘 커밋 내역이 없습니다.';
      const details = await Promise.all(todayCommits.slice(0, 10).map(c => getCommitDetail(owner, repoName, c.sha)));
      return await analyzeDailyWork(repo, details, readOptionalString(args, 'model'));
    }

    case 'send_sms_tran_alarm': {
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
      return [`send_sms_tran_alarm 적재 성공`, `msg_id: ${result.msgId}`, `destaddr: ${result.destaddr}`, `request_date: ${result.requestDate}`].join('\n');
    }

    case 'agent_analyze_config': {
      const result = await analyzeConfig(readRequiredString(args, 'agentHome'), readOptionalString(args, 'os') as 'windows' | 'linux' | undefined);
      return JSON.stringify(result, null, 2);
    }

    case 'agent_analyze_logs': {
      const result = await analyzeLogs(readRequiredString(args, 'agentHome'));
      return JSON.stringify(result, null, 2);
    }

    case 'agent_diagnose': {
      const result = await diagnose(readRequiredString(args, 'agentHome'), readOptionalString(args, 'os') as 'windows' | 'linux' | undefined);
      return JSON.stringify(result, null, 2);
    }

    case 'agent_test_db': {
      const result = await testDb(readRequiredString(args, 'agentHome'));
      return [`dbType: ${result.dbType}`, `url: ${result.url}`, `connected: ${result.connected}`, `elapsedMs: ${result.elapsedMs}`, ...(result.error ? [`error: ${result.error}`] : [])].join('\n');
    }

    case 'agent_insert_sample': {
      const result = await insertSample(readRequiredString(args, 'agentHome'), {
        messageType: readOptionalString(args, 'messageType'),
        destaddr: readOptionalString(args, 'destaddr'),
        sendMsg: readOptionalString(args, 'sendMsg'),
        count: args['count'] !== undefined ? readNumber(args, 'count', 1) : undefined,
      });
      return [`tableName: ${result.tableName}`, `insertedCount: ${result.insertedCount}`, `insertedPks: ${result.insertedPks.join(', ')}`].join('\n');
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function readRequiredString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${key}는 필수 문자열입니다.`);
  return value.trim();
}

function readOptionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error(`${key}는 문자열이어야 합니다.`);
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readNumber(args: Record<string, unknown>, key: string, fallback: number): number {
  const value = args[key];
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${key}는 숫자여야 합니다.`);
  return parsed;
}
