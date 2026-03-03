'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

const dailySummarySchema = z.object({
  repo: z
    .string()
    .min(1, '저장소를 입력해주세요')
    .regex(/^[\w.-]+\/[\w.-]+$/, 'owner/repo 형식으로 입력해주세요'),
});

type DailySummaryFields = z.infer<typeof dailySummarySchema>;

interface DailySummaryFormProps {
  selectedModel: string;
}

export function DailySummaryForm({ selectedModel }: DailySummaryFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DailySummaryFields>({
    resolver: zodResolver(dailySummarySchema),
  });

  useEffect(() => {
    reset();
  }, [reset]);

  const onSubmit = (data: DailySummaryFields) => {
    const params = new URLSearchParams({ repo: data.repo, model: selectedModel });
    router.push(`/daily-summary?${params}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
      <div className="flex gap-2">
        <input
          {...register('repo')}
          placeholder="owner/repo (예: wisecan-github/web-wisecan-oam-back)"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors whitespace-nowrap"
        >
          분석하기
        </button>
      </div>
      {errors.repo && (
        <p className="text-xs text-red-500 mt-1">{errors.repo.message}</p>
      )}
    </form>
  );
}
