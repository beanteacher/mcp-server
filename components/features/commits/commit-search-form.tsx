'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

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

export function CommitSearchForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommitSearchFields>({
    resolver: zodResolver(commitSearchSchema),
  });

  useEffect(() => {
    reset();
  }, [reset]);

  const onSubmit = (data: CommitSearchFields) => {
    const params = new URLSearchParams();
    params.set('repo', data.repo);
    if (data.author?.trim()) params.set('author', data.author.trim());
    if (data.limit) params.set('limit', data.limit);
    router.push(`/commits?${params}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
      <div className="flex gap-2">
        <input
          {...register('repo')}
          placeholder="owner/repo (예: vercel/next.js)"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <input
          {...register('author')}
          placeholder="작성자 (선택)"
          className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <input
          {...register('limit')}
          type="number"
          min={0}
          placeholder="개수 (0=전체)"
          title="가져올 커밋 수 (0 입력 시 전체 조회)"
          className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          조회
        </button>
      </div>
      {errors.repo && (
        <p className="text-xs text-red-500 mt-1">{errors.repo.message}</p>
      )}
    </form>
  );
}
