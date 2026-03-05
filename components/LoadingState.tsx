interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = '불러오는 중...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[240px]">
      <div className="w-10 h-10 rounded-full border-[3px] border-neutral-200 dark:border-neutral-800 border-t-primary-500 animate-spin" />
      <p className="mt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">{message}</p>
    </div>
  );
}
