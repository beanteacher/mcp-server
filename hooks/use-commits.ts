import { useState, useEffect } from 'react';
import type { GitHubDto } from '@/services/github/dto/github.dto';

interface UseCommitsParams {
  repo: string;
  author?: string;
  branch?: string;
  limit?: number;
  refreshKey?: number;
}

interface UseCommitsResult {
  commits: GitHubDto.Commit[];
  isLoading: boolean;
  error: string | null;
}

export function useCommits({ repo, author, branch, limit = 30, refreshKey = 0 }: UseCommitsParams): UseCommitsResult {
  const [commits, setCommits] = useState<GitHubDto.Commit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repo) {
      setCommits([]);
      return;
    }

    const params = new URLSearchParams({ repo, limit: String(limit) });
    if (author) params.set('author', author);
    if (branch) params.set('branch', branch);

    setIsLoading(true);
    setError(null);

    fetch(`/api/commits?${params}`)
      .then((res) => res.json() as Promise<GitHubDto.Commit[] | { error: string }>)
      .then((data) => {
        if ('error' in data) throw new Error(data.error);
        setCommits(data);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '알 수 없는 오류');
      })
      .finally(() => setIsLoading(false));
  }, [repo, author, branch, limit, refreshKey]);

  return { commits, isLoading, error };
}
