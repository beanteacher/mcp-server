import { useEffect, useState } from 'react';
import type { GitHubDto } from '@/services/github/dto/github.dto';

interface UseRepoBranchesParams {
  repo: string;
}

interface UseRepoBranchesResult {
  branches: GitHubDto.Branch[];
  isLoading: boolean;
  error: string | null;
}

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;

export function useRepoBranches({ repo }: UseRepoBranchesParams): UseRepoBranchesResult {
  const [branches, setBranches] = useState<GitHubDto.Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!REPO_PATTERN.test(repo)) {
      setBranches([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams({ repo });
    setIsLoading(true);
    setError(null);

    fetch(`/api/branches?${params}`)
      .then((res) => res.json() as Promise<GitHubDto.Branch[] | { error: string }>)
      .then((data) => {
        if ('error' in data) throw new Error(data.error);
        setBranches(data);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '알 수 없는 오류');
      })
      .finally(() => setIsLoading(false));
  }, [repo]);

  return { branches, isLoading, error };
}
