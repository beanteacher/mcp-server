'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userRepoSearchSchema = z.object({
  username: z.string().min(1, '유저명을 입력해주세요'),
});

type UserRepoSearchFields = z.infer<typeof userRepoSearchSchema>;

interface UserRepoSearchFormProps {
  onSearch: (username: string) => void;
}

export function UserRepoSearchForm({ onSearch }: UserRepoSearchFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserRepoSearchFields>({
    resolver: zodResolver(userRepoSearchSchema),
  });

  const onSubmit = (data: UserRepoSearchFields) => {
    onSearch(data.username);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
      <div className="flex gap-2">
        <input
          {...register('username')}
          placeholder="GitHub 유저명 (예: beanteacher)"
          className="flex-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-neutral-50 bg-primary-500 hover:bg-primary-700 rounded-lg transition-colors active:scale-95"
        >
          조회
        </button>
      </div>
      {errors.username && (
        <p className="text-xs text-error mt-1">{errors.username.message}</p>
      )}
    </form>
  );
}
