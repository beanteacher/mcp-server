import type { GitHubDto } from '@/services/github/dto/github.dto';

interface CommitCardProps {
  commit: GitHubDto.Commit;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
}

export function CommitCard({ commit }: CommitCardProps) {
  const { sha, commit: info } = commit;
  const author = info.author?.name ?? '알 수 없음';
  const message = info.message.split('\n')[0];

  return (
    <div className="flex items-start gap-4 py-3">
      <div className="flex flex-col items-center mt-1">
        <div className="w-3 h-3 rounded-full bg-primary-500 ring-2 ring-primary-900 flex-shrink-0" />
        <div className="w-0.5 h-full bg-neutral-800 mt-1" />
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm font-medium text-neutral-50 leading-snug">{message}</p>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-xs bg-neutral-800 text-primary-300 px-1.5 py-0.5 rounded font-mono">
            {sha.slice(0, 7)}
          </code>
          <span className="text-xs text-neutral-400">{author}</span>
          <span className="text-xs text-neutral-600">·</span>
          <span className="text-xs text-neutral-400">
            {info.author?.date ? relativeTime(info.author.date) : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
