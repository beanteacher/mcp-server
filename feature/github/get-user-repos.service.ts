import type { GitHubDto } from './dto';
import { githubHeaders, parseErrorMessage } from './shared';

export async function getUserRepos(username: string): Promise<GitHubDto.Repo[]> {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    { headers: githubHeaders() },
  );

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(body, res.status));
  }

  return res.json() as Promise<GitHubDto.Repo[]>;
}
