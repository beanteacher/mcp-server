import { getTodayCommits } from './get-today-commits.service';
import { getCommitDetail } from './get-commit-detail.service';
import { analyzeDailyWork } from '@/lib/gemini';

export async function getDailySummary(
  owner: string,
  repo: string,
  branch?: string,
  model?: string,
): Promise<string> {
  const todayCommits = await getTodayCommits(owner, repo, branch);
  if (todayCommits.length === 0) return '오늘 커밋 내역이 없습니다.';
  const details = await Promise.all(todayCommits.slice(0, 10).map(c => getCommitDetail(owner, repo, c.sha)));
  return analyzeDailyWork(`${owner}/${repo}`, details, model);
}
