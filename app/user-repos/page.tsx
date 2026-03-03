import Link from 'next/link';
import { getUserRepos } from '@/services/github/github.service';
import type { GitHubDto } from '@/services/github/dto/github.dto';
import { BackButton } from '@/components/ui/back-button';
import { UserRepoSearchForm } from '@/components/features/user-repos/user-repo-search-form';

export default async function UserReposPage({
  searchParams,
}: {
  searchParams: { username?: string };
}) {
  const username = searchParams?.username || '';

  let repos: GitHubDto.Repo[] = [];
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
        <BackButton />
        <h2 className="text-lg font-semibold text-gray-800">유저 레포지토리 목록</h2>
      </div>

      {/* 유저명 입력 폼 */}
      <UserRepoSearchForm />

      {/* 에러 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6">
          오류: {error}
        </div>
      )}

      {/* 안내 메시지 */}
      {!username && (
        <p className="text-sm text-gray-400 text-center py-12">
          GitHub 유저명을 입력하고 조회 버튼을 누르세요.
        </p>
      )}

      {/* 레포 목록 */}
      {repos.length > 0 && (
        <>
          <p className="text-xs text-gray-400 mb-3">총 {repos.length}개의 레포지토리</p>
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            {repos.map((repo) => (
              <a
                key={repo.name}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-600 truncate">{repo.name}</p>
                  {repo.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{repo.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{repo.updated_at.slice(0, 10)}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {repo.language && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {repo.language}
                    </span>
                  )}
                  {repo.stargazers_count > 0 && (
                    <span className="text-xs text-yellow-600">⭐{repo.stargazers_count}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* 결과 없음 */}
      {username && repos.length === 0 && !error && (
        <p className="text-sm text-gray-400 text-center py-12">
          레포지토리가 없거나 유저를 찾을 수 없습니다.
        </p>
      )}
    </div>
  );
}
