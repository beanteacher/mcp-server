import type { GitHubDto } from './dto';
import { githubHeaders, parseErrorMessage } from './shared';

export async function getBranches(owner: string, repo: string): Promise<GitHubDto.Branch[]> {
  const all: GitHubDto.Branch[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({ per_page: '100', page: String(page) });
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?${params}`,
      { headers: githubHeaders() },
    );

    if (!res.ok) {
      const body: unknown = await res.json().catch(() => ({}));
      throw new Error(parseErrorMessage(body, res.status));
    }

    const data = (await res.json()) as GitHubDto.Branch[];
    all.push(...data);
    if (data.length < 100) break;
    page++;
  }

  return all;
}
