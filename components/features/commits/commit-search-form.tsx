'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRepoBranches } from '@/hooks/use-repo-branches';

const commitSearchSchema = z.object({
  repo: z
    .string()
    .min(1, '저장소를 입력해주세요')
    .regex(/^[\w.-]+\/[\w.-]+$/, 'owner/repo 형식으로 입력해주세요'),
  author: z.string().optional(),
  branch: z.string().optional(),
  limit: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === '' || !isNaN(Number(v)), '숫자를 입력해주세요'),
});

type CommitSearchFields = z.infer<typeof commitSearchSchema>;

interface CommitSearchFormProps {
  onSearch: (params: { repo: string; author?: string; branch?: string; limit: number }) => void;
}

export function CommitSearchForm({ onSearch }: CommitSearchFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CommitSearchFields>({
    resolver: zodResolver(commitSearchSchema),
    defaultValues: { repo: 'beanteacher/mcp-server', branch: '', limit: '0' },
  });

  const repo = watch('repo')?.trim() ?? '';
  const { branches, isLoading: branchLoading } = useRepoBranches({ repo });

  useEffect(() => {
    setValue('branch', '');
  }, [repo, setValue]);

  const onSubmit = (data: CommitSearchFields) => {
    onSearch({
      repo: data.repo,
      author: data.author?.trim() || undefined,
      branch: data.branch?.trim() || undefined,
      limit: data.limit !== undefined && data.limit !== '' ? Number(data.limit) : 0,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          {...register('repo')}
          placeholder="저장소 (소유자/레포명)"
          className="flex-1 min-w-0 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <input
          {...register('author')}
          placeholder="작성자"
          className="w-full sm:w-28 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <select
          {...register('branch')}
          className="w-full sm:w-40 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">기본 브랜치</option>
          {branches.map((branch) => (
            <option key={branch.name} value={branch.name}>
              {branch.name}
            </option>
          ))}
        </select>
        <input
          {...register('limit')}
          type="number"
          min={0}
          placeholder="개수 (0=전체)"
          title="가져올 커밋 수 (0 입력 시 전체 조회)"
          className="w-full sm:w-28 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-neutral-50 bg-primary-500 hover:bg-primary-700 rounded-lg transition-colors active:scale-95"
        >
          조회
        </button>
      </div>
      {errors.repo && (
        <p className="text-xs text-error mt-1">{errors.repo.message}</p>
      )}
      {!errors.repo && repo && branchLoading && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">브랜치 목록을 불러오는 중...</p>
      )}
    </form>
  );
}
