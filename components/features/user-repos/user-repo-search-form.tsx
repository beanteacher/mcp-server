'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

const userRepoSearchSchema = z.object({
  username: z.string().min(1, '유저명을 입력해주세요'),
});

type UserRepoSearchFields = z.infer<typeof userRepoSearchSchema>;

export function UserRepoSearchForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserRepoSearchFields>({
    resolver: zodResolver(userRepoSearchSchema),
  });

  useEffect(() => {
    reset();
  }, [reset]);

  const onSubmit = (data: UserRepoSearchFields) => {
    router.push(`/user-repos?username=${encodeURIComponent(data.username)}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
      <div className="flex gap-2">
        <input
          {...register('username')}
          placeholder="GitHub 유저명 (예: beanteacher)"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          조회
        </button>
      </div>
      {errors.username && (
        <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
      )}
    </form>
  );
}
