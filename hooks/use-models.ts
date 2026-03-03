import { useState, useEffect } from 'react';

interface UseModelsResult {
  models: string[];
  isLoading: boolean;
  error: string | null;
}

export function useModels(enabled = true): UseModelsResult {
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    fetch('/api/models')
      .then((res) => res.json() as Promise<string[] | { error: string }>)
      .then((data) => {
        if (!Array.isArray(data) && 'error' in data) throw new Error(data.error);
        setModels(data as string[]);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '모델 목록 조회 실패');
      })
      .finally(() => setIsLoading(false));
  }, [enabled]);

  return { models, isLoading, error };
}
