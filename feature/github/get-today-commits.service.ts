import type { GitHubDto } from './dto';
import { githubHeaders, parseErrorMessage } from './shared';

export async function getTodayCommits(
  owner: string,
  repo: string,
  branch?: string,
): Promise<GitHubDto.Commit[]> {
  const now = new Date();
  const kstMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const since = new Date(kstMidnight.getTime() - 9 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({ per_page: '50', since });
  if (branch) params.set('sha', branch);

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?${params}`,
    { headers: githubHeaders() },
  );

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(body, res.status));
  }

  return res.json() as Promise<GitHubDto.Commit[]>;
}
