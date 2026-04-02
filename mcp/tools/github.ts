import { getCommits, formatCommits } from '@/feature/github/get-commits.service';
import { getAllCommits } from '@/feature/github/get-all-commits.service';
import { getUserRepos, formatUserRepos } from '@/feature/github/get-user-repos.service';
import { getDailySummary } from '@/feature/github/daily-summary.service';
import { ToolModule } from '@/mcp/types';
import { readRequiredString, readOptionalString, readNumber } from '@/mcp/utils';

export const githubModule: ToolModule = {
  tools: [
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
  ],

  async handle(name, args) {
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
        return formatCommits(commits);
      }

      case 'get_user_repos': {
        const repos = await getUserRepos(readRequiredString(args, 'username'));
        return formatUserRepos(repos);
      }

      case 'get_daily_summary': {
        const repo = readRequiredString(args, 'repo');
        const [owner, repoName] = repo.split('/');
        return getDailySummary(owner, repoName, readOptionalString(args, 'branch'), readOptionalString(args, 'model'));
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  },
};
