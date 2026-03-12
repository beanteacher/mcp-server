import { useState, useEffect } from 'react';

interface UseDailySummaryParams {
  repo: string;
  branch?: string;
  model?: string;
  enabled?: boolean;
  refreshKey?: number;
}

interface UseDailySummaryResult {
  summary: string | null;
  commitCount: number;
  isLoading: boolean;
  error: string | null;
}

interface CachedResult {
  summary: string;
  commitCount: number;
}

/** 브라우저 세션 동안 유지되는 메모리 캐시 */
const summaryCache = new Map<string, CachedResult>();

function getCacheKey(repo: string, branch: string, model: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${repo}::${branch}::${model}::${today}`;
}

export function useDailySummary({
  repo,
  branch = '',
  model = 'models/gemini-2.5-flash',
  enabled = true,
  refreshKey = 0,
}: UseDailySummaryParams): UseDailySummaryResult {
  const [summary, setSummary] = useState<string | null>(null);
  const [commitCount, setCommitCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !repo) {
      setSummary(null);
      setCommitCount(0);
      return;
    }

    const cacheKey = getCacheKey(repo, branch, model);

    // refreshKey가 증가하면 캐시 무효화 (재시도 버튼)
    if (refreshKey > 0) {
      summaryCache.delete(cacheKey);
    }

    // 캐시 히트 → API 호출 없이 즉시 반환
    const cached = summaryCache.get(cacheKey);
    if (cached) {
      setSummary(cached.summary);
      setCommitCount(cached.commitCount);
      setError(null);
      return;
    }

    // 캐시 미스 → Gemini API 호출
    const params = new URLSearchParams({ repo, model });
    if (branch) params.set('branch', branch);
    setIsLoading(true);
    setError(null);

    fetch(`/api/daily-summary?${params}`)
      .then((res) => res.json() as Promise<{ summary: string; commitCount: number } | { error: string }>)
      .then((data) => {
        if ('error' in data) throw new Error(data.error);
        summaryCache.set(cacheKey, { summary: data.summary, commitCount: data.commitCount });
        setSummary(data.summary);
        setCommitCount(data.commitCount);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '알 수 없는 오류');
      })
      .finally(() => setIsLoading(false));
  }, [enabled, repo, branch, model, refreshKey]);

  return { summary, commitCount, isLoading, error };
}
