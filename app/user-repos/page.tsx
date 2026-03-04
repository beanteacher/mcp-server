import Link from 'next/link';
import { getUserRepos, type GitHubRepo } from '../../lib/github';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';

export default async function UserReposPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  const { username = '' } = await searchParams;

  let repos: GitHubRepo[] = [];
  let error: string | null = null;

  if (username) {
    try {
      repos = await getUserRepos(username);
    } catch (e) {
      error = e instanceof Error ? e.message : '알 수 없는 오류';
    }
  }

  return (
    <div className="max-w-2xl">
      {/* 뒤로가기 + 제목 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-neutral-600 hover:text-neutral-50 transition-colors text-sm font-medium"
        >
          ← 뒤로
        </Link>
        <h2 className="text-lg font-semibold text-neutral-50">유저 레포지토리 목록</h2>
      </div>

      {/* 유저명 입력 폼 */}
      <form method="GET" className="flex gap-2 mb-8">
        <input
          type="text"
          name="username"
          defaultValue={username}
          placeholder="GitHub 유저명 (예: beanteacher)"
          className="flex-1 px-3 py-2 text-sm border border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-neutral-800 text-neutral-50 placeholder:text-neutral-600"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-700 rounded-lg transition-colors"
        >
          조회
        </button>
      </form>

      {/* 에러 */}
      {error && <ErrorState message={error} />}

      {/* 안내 메시지 */}
      {!username && (
        <EmptyState
          message="유저명을 입력하세요"
          description="GitHub 유저명을 입력 후 조회하세요."
        />
      )}

      {/* 레포 목록 */}
      {repos.length > 0 && (
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
                    <span className="text-xs text-warning">★ {repo.stargazers_count}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* 결과 없음 */}
      {username && repos.length === 0 && !error && (
        <EmptyState
          message="레포지토리가 없습니다"
          description="해당 유저의 공개 레포지토리가 없거나 유저를 찾을 수 없습니다."
        />
      )}
    </div>
  );
}
