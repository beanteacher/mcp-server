interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = '알 수 없는 오류가 발생했습니다.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[240px] p-8">
      <div className="w-12 h-12 flex items-center justify-center text-error text-4xl mb-4">
        ⚠
      </div>
      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">오류가 발생했습니다</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-[320px] text-center mt-2">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 px-6 py-2 bg-primary-500 hover:bg-primary-700 text-neutral-50 font-semibold text-sm rounded-md transition-colors duration-150 active:scale-95"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
