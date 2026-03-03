import type { GitHubDto } from './dto/github.dto';

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body !== null && typeof body === 'object' && 'message' in body) {
    const msg = (body as Record<string, unknown>)['message'];
    if (typeof msg === 'string') return msg;
  }
  return `GitHub API 오류: ${status}`;
}

export async function getCommits(
  owner: string,
  repo: string,
  perPage = 30,
  author?: string,
): Promise<GitHubDto.Commit[]> {
  const params = new URLSearchParams({ per_page: String(Math.min(perPage, 100)) });
  if (author) params.set('author', author);

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?${params}`,
    { headers: githubHeaders(), next: { revalidate: 60 } },
  );

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(body, res.status));
  }

  return res.json() as Promise<GitHubDto.Commit[]>;
}

export async function getAllCommits(
  owner: string,
  repo: string,
  author?: string,
): Promise<GitHubDto.Commit[]> {
  const all: GitHubDto.Commit[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({ per_page: '100', page: String(page) });
    if (author) params.set('author', author);

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?${params}`,
      { headers: githubHeaders(), cache: 'no-store' },
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

export async function getTodayCommits(
  owner: string,
  repo: string,
): Promise<GitHubDto.Commit[]> {
  const now = new Date();
  const kstMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const since = new Date(kstMidnight.getTime() - 9 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=50&since=${since}`,
    { headers: githubHeaders(), cache: 'no-store' },
  );

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(body, res.status));
  }

  return res.json() as Promise<GitHubDto.Commit[]>;
}

export async function getCommitDetail(
  owner: string,
  repo: string,
  sha: string,
): Promise<GitHubDto.CommitDetail> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
    { headers: githubHeaders(), cache: 'no-store' },
  );

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(body, res.status));
  }

  return res.json() as Promise<GitHubDto.CommitDetail>;
}

export async function getUserRepos(username: string): Promise<GitHubDto.Repo[]> {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    { headers: githubHeaders(), next: { revalidate: 60 } },
  );

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(body, res.status));
  }

  return res.json() as Promise<GitHubDto.Repo[]>;
}
