import type { GitHubDto } from './dto';
import { githubHeaders, parseErrorMessage } from './shared';

export async function getCommits(
  owner: string,
  repo: string,
  perPage = 30,
  author?: string,
  branch?: string,
): Promise<GitHubDto.Commit[]> {
  const params = new URLSearchParams({ per_page: String(Math.min(perPage, 100)) });
  if (author) params.set('author', author);
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
