'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const commitSearchSchema = z.object({
  repo: z
    .string()
    .min(1, '저장소를 입력해주세요')
    .regex(/^[\w.-]+\/[\w.-]+$/, 'owner/repo 형식으로 입력해주세요'),
  author: z.string().optional(),
  limit: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === '' || !isNaN(Number(v)), '숫자를 입력해주세요'),
});

type CommitSearchFields = z.infer<typeof commitSearchSchema>;

interface CommitSearchFormProps {
  onSearch: (params: { repo: string; author?: string; limit: number }) => void;
}

export function CommitSearchForm({ onSearch }: CommitSearchFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CommitSearchFields>({
    resolver: zodResolver(commitSearchSchema),
  });

  const onSubmit = (data: CommitSearchFields) => {
    onSearch({
      repo: data.repo,
      author: data.author?.trim() || undefined,
      limit: data.limit ? Number(data.limit) : 30,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          {...register('repo')}
          placeholder="owner/repo (예: vercel/next.js)"
          className="flex-1 min-w-0 bg-neutral-800 border border-neutral-800 text-neutral-50 placeholder:text-neutral-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <input
          {...register('author')}
          placeholder="작성자 (선택)"
          className="w-full sm:w-32 bg-neutral-800 border border-neutral-800 text-neutral-50 placeholder:text-neutral-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <input
          {...register('limit')}
          type="number"
          min={0}
          placeholder="개수 (0=전체)"
          title="가져올 커밋 수 (0 입력 시 전체 조회)"
          className="w-full sm:w-28 bg-neutral-800 border border-neutral-800 text-neutral-50 placeholder:text-neutral-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-neutral-50 bg-primary-500 hover:bg-primary-700 rounded-lg transition-colors"
        >
          조회
        </button>
      </div>
      {errors.repo && (
        <p className="text-xs text-error mt-1">{errors.repo.message}</p>
      )}
    </form>
  );
}
