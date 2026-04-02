import type { GitHubDto } from './dto';
import { githubHeaders, parseErrorMessage } from './shared';

export async function getAllCommits(
  owner: string,
  repo: string,
  author?: string,
  branch?: string,
): Promise<GitHubDto.Commit[]> {
  const all: GitHubDto.Commit[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({ per_page: '100', page: String(page) });
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

    const data = (await res.json()) as GitHubDto.Commit[];
    all.push(...data);
    if (data.length < 100) break;
    page++;
  }

  return all;
}
