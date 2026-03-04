'use client';

import { useState } from 'react';
import { BackButton } from '@/components/ui/back-button';
import { CommitCard } from '@/components/common/commit-card';
import { CommitSearchForm } from '@/components/features/commits/commit-search-form';
import { useCommits } from '@/hooks/use-commits';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import type { GitHubDto } from '@/services/github/dto/github.dto';

interface CommitQuery {
  repo: string;
  author?: string;
  limit: number;
}

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

const PAGE_SIZE = 20;

export function CommitsContent() {
  const [query, setQuery] = useState<CommitQuery | null>(null);
  const [page, setPage] = useState(1);

  const { commits, isLoading, error } = useCommits({
    repo: query?.repo ?? '',
    author: query?.author,
    limit: query?.limit ?? 30,
  });

  const handleSearch = (params: CommitQuery) => {
    setQuery(params);
    setPage(1);
  };

  const fetchAll = query?.limit === 0;
  const totalPages = Math.ceil(commits.length / PAGE_SIZE);
  const safePage = Math.min(page, totalPages || 1);
  const pagedCommits = commits.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const grouped = pagedCommits.length > 0 ? groupByDate(pagedCommits) : {};

  return (
    <>
      {/* 뒤로가기 + 제목 */}
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <div>
          <h2 className="text-lg font-semibold text-neutral-50">
            Git 커밋 타임라인
            {query && commits.length > 0 && (
              <span className="ml-2 text-sm font-normal text-neutral-400">
                ({fetchAll ? '전체' : `최근 ${query.limit}개`} · {commits.length}건)
              </span>
            )}
          </h2>
          {query?.repo && (
            <p className="text-xs text-neutral-400 mt-0.5">
              {query.repo}
              {query.author && <span className="ml-2 font-medium text-primary-300">@{query.author}</span>}
            </p>
          )}
        </div>
      </div>

      {/* 저장소 입력 폼 */}
      <CommitSearchForm onSearch={handleSearch} />

      {/* 로딩 */}
      {isLoading && <LoadingState />}

      {/* 에러 */}
      {!isLoading && error && <ErrorState message={error} />}

      {/* 안내 메시지 */}
      {!isLoading && !query && (
        <EmptyState message="저장소를 입력하세요" description="owner/repo 형식으로 입력 후 조회하세요." />
      )}

      {/* 커밋 타임라인 */}
      {!isLoading && !error &&
        Object.entries(grouped).map(([date, dayCommits]) => (
          <div key={date} className="mb-6">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              {date}
            </p>
            <div className="bg-surface-card border border-neutral-800 rounded-xl px-5 divide-y divide-neutral-800">
              {dayCommits.map((commit) => (
                <CommitCard key={commit.sha} commit={commit} />
              ))}
            </div>
          </div>
        ))}

      {/* 결과 없음 */}
      {!isLoading && query && commits.length === 0 && !error && (
        <EmptyState message="커밋이 없습니다" description="해당 저장소에 커밋 내역이 없습니다." />
      )}

      {/* 페이지네이션 */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 mb-2">
          {safePage > 1 ? (
            <button
              type="button"
              onClick={() => setPage(safePage - 1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-800 transition-colors text-neutral-600 hover:text-neutral-50"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span className="w-8 h-8" />
          )}
          <span className="text-sm text-neutral-400">
            {safePage} / {totalPages}
          </span>
          {safePage < totalPages ? (
            <button
              type="button"
              onClick={() => setPage(safePage + 1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-800 transition-colors text-neutral-600 hover:text-neutral-50"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span className="w-8 h-8" />
          )}
        </div>
      )}
    </>
  );
}
