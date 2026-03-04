import { useState, useEffect } from 'react';

interface UseDailySummaryParams {
  repo: string;
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

export function useDailySummary({
  repo,
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

    const params = new URLSearchParams({ repo, model });
    setIsLoading(true);
    setError(null);

    fetch(`/api/daily-summary?${params}`)
      .then((res) => res.json() as Promise<{ summary: string; commitCount: number } | { error: string }>)
      .then((data) => {
        if ('error' in data) throw new Error(data.error);
        setSummary(data.summary);
        setCommitCount(data.commitCount);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '알 수 없는 오류');
      })
      .finally(() => setIsLoading(false));
  }, [enabled, repo, model, refreshKey]);

  return { summary, commitCount, isLoading, error };
}
