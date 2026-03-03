export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
  };
  html_url: string;
}

export interface CommitFile {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string; // diff 내용 (없을 수도 있음)
}

export interface CommitDetail extends GitHubCommit {
  files: CommitFile[];
  stats: { additions: number; deletions: number; total: number };
}

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

// Server Component에서만 호출 (토큰 클라이언트 노출 없음)
export async function getCommits(owner: string, repo: string): Promise<GitHubCommit[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`,
    { headers: githubHeaders(), next: { revalidate: 60 } }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(error.message || `GitHub API 오류: ${res.status}`);
  }

  return res.json();
}

// 오늘 00:00(KST) 이후 커밋만 조회
export async function getTodayCommits(owner: string, repo: string): Promise<GitHubCommit[]> {
  // KST = UTC+9, 오늘 00:00 KST = 전날 15:00 UTC
  const now = new Date();
  const kstMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const since = new Date(kstMidnight.getTime() - 9 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=50&since=${since}`,
    { headers: githubHeaders(), cache: 'no-store' }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(error.message || `GitHub API 오류: ${res.status}`);
  }

  return res.json();
}

// 특정 커밋의 파일 diff 상세 조회
export async function getCommitDetail(owner: string, repo: string, sha: string): Promise<CommitDetail> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
    { headers: githubHeaders(), cache: 'no-store' }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(error.message || `GitHub API 오류: ${res.status}`);
  }

  return res.json();
}
