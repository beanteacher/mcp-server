import { useState, useEffect } from 'react';
import type { GitHubDto } from '@/services/github/dto/github.dto';

interface UseUserReposParams {
  username: string;
}

interface UseUserReposResult {
  repos: GitHubDto.Repo[];
  isLoading: boolean;
  error: string | null;
}

export function useUserRepos({ username }: UseUserReposParams): UseUserReposResult {
  const [repos, setRepos] = useState<GitHubDto.Repo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setRepos([]);
      return;
    }

    const params = new URLSearchParams({ username });
    setIsLoading(true);
    setError(null);

    fetch(`/api/user-repos?${params}`)
      .then((res) => res.json() as Promise<GitHubDto.Repo[] | { error: string }>)
      .then((data) => {
        if ('error' in data) throw new Error(data.error);
        setRepos(data);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '알 수 없는 오류');
      })
      .finally(() => setIsLoading(false));
  }, [username]);

  return { repos, isLoading, error };
}
