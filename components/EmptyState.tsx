interface EmptyStateProps {
  message?: string;
  description?: string;
}

export function EmptyState({
  message = '표시할 데이터가 없습니다',
  description = '조건을 변경하거나 잠시 후 다시 확인해 주세요.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[240px] p-8">
      <div className="w-12 h-12 flex items-center justify-center text-neutral-500 dark:text-neutral-400 text-4xl mb-4">
        ○
      </div>
      <p className="text-lg font-semibold text-neutral-500 dark:text-neutral-400">{message}</p>
      <p className="text-sm text-neutral-400 dark:text-neutral-600 max-w-[280px] text-center mt-2">{description}</p>
    </div>
  );
}
