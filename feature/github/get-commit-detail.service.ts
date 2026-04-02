import type { GitHubDto } from './dto';
import { githubHeaders, parseErrorMessage } from './shared';

export async function getCommitDetail(
  owner: string,
  repo: string,
  sha: string,
): Promise<GitHubDto.CommitDetail> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
    { headers: githubHeaders() },
  );

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(body, res.status));
  }

  return res.json() as Promise<GitHubDto.CommitDetail>;
}
