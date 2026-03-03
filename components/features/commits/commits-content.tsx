'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { CommitCard } from '@/components/common/commit-card';
import { CommitSearchForm } from '@/components/features/commits/commit-search-form';
import { useCommits } from '@/hooks/use-commits';
import type { GitHubDto } from '@/services/github/dto/github.dto';

function groupByDate(commits: GitHubDto.Commit[]): Record<string, GitHubDto.Commit[]> {
  return commits.reduce<Record<string, GitHubDto.Commit[]>>((groups, commit) => {
    const date = new Date(commit.commit.author?.date ?? '').toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(commit);
    return groups;
  }, {});
}

const DEFAULT_LIMIT = 30;
const PAGE_SIZE = 20;

export function CommitsContent() {
  const searchParams = useSearchParams();
  const targetRepo = searchParams.get('repo') ?? '';
  const limitParam = Number(searchParams.get('limit') ?? DEFAULT_LIMIT);
  const author = searchParams.get('author')?.trim() || undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const fetchAll = limitParam === 0;

  const { commits, isLoading, error } = useCommits({ repo: targetRepo, author, limit: limitParam });

  const totalPages = Math.ceil(commits.length / PAGE_SIZE);
  const safePage = Math.min(page, totalPages || 1);
  const pagedCommits = commits.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const grouped = pagedCommits.length > 0 ? groupByDate(pagedCommits) : {};

  const baseQuery = new URLSearchParams();
  if (targetRepo) baseQuery.set('repo', targetRepo);
  if (author) baseQuery.set('author', author);
  const limitStr = searchParams.get('limit');
  if (limitStr) baseQuery.set('limit', limitStr);

  const prevQuery = new URLSearchParams(baseQuery);
  prevQuery.set('page', String(safePage - 1));
  const nextQuery = new URLSearchParams(baseQuery);
  nextQuery.set('page', String(safePage + 1));

  return (
    <>
      {/* 뒤로가기 + 제목 */}
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Git 커밋 타임라인
            {commits.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({fetchAll ? '전체' : `최근 ${limitParam}개`} · {commits.length}건)
              </span>
            )}
          </h2>
          {targetRepo && (
            <p className="text-xs text-gray-400 mt-0.5">
              {targetRepo}
              {author && <span className="ml-2 font-medium text-blue-400">@{author}</span>}
            </p>
          )}
        </div>
      </div>

      {/* 저장소 입력 폼 */}
      <CommitSearchForm />

      {/* 로딩 */}
      {isLoading && (
        <p className="text-sm text-gray-400 text-center py-12">불러오는 중...</p>
      )}

      {/* 에러 */}
      {!isLoading && error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6">
          오류: {error}
        </div>
      )}

      {/* 안내 메시지 */}
      {!isLoading && !targetRepo && (
        <p className="text-sm text-gray-400 text-center py-12">
          저장소를 입력하고 조회 버튼을 누르세요.
        </p>
      )}

      {/* 커밋 타임라인 */}
      {!isLoading &&
        Object.entries(grouped).map(([date, dayCommits]) => (
          <div key={date} className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {date}
            </p>
            <div className="bg-white border border-gray-100 rounded-xl px-5 divide-y divide-gray-50">
              {dayCommits.map((commit) => (
                <CommitCard key={commit.sha} commit={commit} />
              ))}
            </div>
          </div>
        ))}

      {/* 결과 없음 */}
      {!isLoading && targetRepo && commits.length === 0 && !error && (
        <p className="text-sm text-gray-400 text-center py-12">
          커밋이 없거나 저장소를 찾을 수 없습니다.
        </p>
      )}

      {/* 페이지네이션 */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 mb-2">
          {safePage > 1 ? (
            <Link
              href={`/commits?${prevQuery}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : (
            <span className="w-8 h-8" />
          )}
          <span className="text-sm text-gray-500">
            {safePage} / {totalPages}
          </span>
          {safePage < totalPages ? (
            <Link
              href={`/commits?${nextQuery}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : (
            <span className="w-8 h-8" />
          )}
        </div>
      )}
    </>
  );
}
