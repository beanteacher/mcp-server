'use client';

import { useState } from 'react';
import { BackButton } from '@/components/ui/back-button';
import { UserRepoSearchForm } from '@/components/features/user-repos/user-repo-search-form';
import { useUserRepos } from '@/hooks/use-user-repos';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

export function UserReposContent() {
  const [username, setUsername] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const { repos, isLoading, error } = useUserRepos({ username, refreshKey });

  return (
    <>
      {/* 뒤로가기 + 제목 */}
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <h2 className="text-lg font-semibold text-neutral-50">유저 레포지토리 목록</h2>
      </div>

      {/* 유저명 입력 폼 */}
      <UserRepoSearchForm onSearch={setUsername} />

      {/* 로딩 */}
      {isLoading && <LoadingState />}

      {/* 에러 */}
      {!isLoading && error && <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />}

      {/* 안내 메시지 */}
      {!isLoading && !username && (
        <EmptyState message="유저명을 입력하세요" description="GitHub 유저명을 입력 후 조회하세요." />
      )}

      {/* 레포 목록 */}
      {!isLoading && repos.length > 0 && (
        <>
          <p className="text-xs text-neutral-400 mb-3">총 {repos.length}개의 레포지토리</p>
          <div className="bg-surface-card border border-neutral-800 rounded-xl divide-y divide-neutral-800">
            {repos.map((repo) => (
              <a
                key={repo.name}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between px-5 py-4 hover:bg-neutral-800 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary-300 truncate">{repo.name}</p>
                  {repo.description && (
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">{repo.description}</p>
                  )}
                  <p className="text-xs text-neutral-600 mt-1">{repo.updated_at.slice(0, 10)}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {repo.language && (
                    <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
                      {repo.language}
                    </span>
                  )}
                  {repo.stargazers_count > 0 && (
                    <span className="text-xs text-warning">⭐{repo.stargazers_count}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* 결과 없음 */}
      {!isLoading && username && repos.length === 0 && !error && (
        <EmptyState message="레포지토리가 없습니다" description="해당 유저의 공개 레포지토리가 없습니다." />
      )}
    </>
  );
}
