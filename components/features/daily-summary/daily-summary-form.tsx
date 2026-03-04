'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const dailySummarySchema = z.object({
  repo: z
    .string()
    .min(1, '저장소를 입력해주세요')
    .regex(/^[\w.-]+\/[\w.-]+$/, 'owner/repo 형식으로 입력해주세요'),
});

type DailySummaryFields = z.infer<typeof dailySummarySchema>;

interface DailySummaryFormProps {
  onSearch: (repo: string) => void;
}

export function DailySummaryForm({ onSearch }: DailySummaryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DailySummaryFields>({
    resolver: zodResolver(dailySummarySchema),
  });

  const onSubmit = (data: DailySummaryFields) => {
    onSearch(data.repo);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
      <div className="flex gap-2">
        <input
          {...register('repo')}
          placeholder="owner/repo (예: wisecan-github/web-wisecan-oam-back)"
          className="flex-1 bg-neutral-800 border border-neutral-800 text-neutral-50 placeholder:text-neutral-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-neutral-50 bg-primary-500 hover:bg-primary-700 rounded-lg transition-colors whitespace-nowrap"
        >
          분석하기
        </button>
      </div>
      {errors.repo && (
        <p className="text-xs text-error mt-1">{errors.repo.message}</p>
      )}
    </form>
  );
}
