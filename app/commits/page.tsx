import Link from 'next/link';
import { getCommits, type GitHubCommit } from '../../lib/github';
import CommitCard from '../../components/CommitCard';

function groupByDate(commits: GitHubCommit[]): Record<string, GitHubCommit[]> {
  return commits.reduce<Record<string, GitHubCommit[]>>((groups, commit) => {
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

export default async function CommitsPage({
  searchParams,
}: {
  searchParams: { repo?: string };
}) {
  const targetRepo = searchParams?.repo || process.env.GITHUB_DEFAULT_REPO || '';
  const [owner, repoName] = targetRepo.split('/');

  let commits: GitHubCommit[] = [];
  let error: string | null = null;

  if (owner && repoName) {
    try {
      commits = await getCommits(owner, repoName);
    } catch (e) {
      error = e instanceof Error ? e.message : '알 수 없는 오류';
    }
  }

  const grouped = commits.length > 0 ? groupByDate(commits) : {};

  return (
    <div className="max-w-2xl">
      {/* 뒤로가기 + 제목 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium"
        >
          ← 뒤로
        </Link>
        <h2 className="text-lg font-semibold text-gray-800">Git 커밋 타임라인</h2>
      </div>

      {/* 저장소 입력 폼 */}
      <form method="GET" className="flex gap-2 mb-8">
        <input
          type="text"
          name="repo"
          defaultValue={targetRepo}
          placeholder="owner/repo (예: vercel/next.js)"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          조회
        </button>
      </form>

      {/* 에러 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6">
          오류: {error}
        </div>
      )}

      {/* 안내 메시지 */}
      {!targetRepo && (
        <p className="text-sm text-gray-400 text-center py-12">
          저장소를 입력하고 조회 버튼을 누르세요.
        </p>
      )}

      {/* 커밋 타임라인 */}
      {Object.entries(grouped).map(([date, dayCommits]) => (
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
      {targetRepo && commits.length === 0 && !error && (
        <p className="text-sm text-gray-400 text-center py-12">
          커밋이 없거나 저장소를 찾을 수 없습니다.
        </p>
      )}
    </div>
  );
}
