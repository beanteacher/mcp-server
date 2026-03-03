import Link from 'next/link';
import { getTodayCommits, getCommitDetail } from '../../lib/github';
import { analyzeDailyWork } from '../../lib/claude';

export const dynamic = 'force-dynamic'; // 매 요청마다 서버에서 새로 fetch

export default async function DailySummaryPage({
  searchParams,
}: {
  searchParams: { repo?: string };
}) {
  const targetRepo = searchParams?.repo || process.env.GITHUB_DEFAULT_REPO || '';
  const [owner, repoName] = targetRepo.split('/');

  let summary: string | null = null;
  let error: string | null = null;
  let commitCount = 0;

  if (owner && repoName) {
    try {
      // 1. 오늘 커밋 목록 조회
      const todayCommits = await getTodayCommits(owner, repoName);
      commitCount = todayCommits.length;

      if (todayCommits.length > 0) {
        // 2. 각 커밋의 파일 diff 조회 (최대 10개)
        const details = await Promise.all(
          todayCommits.slice(0, 10).map((c) => getCommitDetail(owner, repoName, c.sha))
        );
        // 3. Claude AI 분석
        summary = await analyzeDailyWork(targetRepo, details);
      } else {
        summary = '오늘 커밋 내역이 없습니다.';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '알 수 없는 오류';
    }
  }

  return (
    <div className="max-w-2xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">
          ← 뒤로
        </Link>
        <h2 className="text-lg font-semibold text-gray-800">오늘의 작업 정리</h2>
      </div>

      {/* 저장소 입력 폼 */}
      <form method="GET" className="flex gap-2 mb-8">
        <input
          type="text"
          name="repo"
          defaultValue={targetRepo}
          placeholder="owner/repo (예: wisecan-github/web-wisecan-oam-back)"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors whitespace-nowrap"
        >
          분석하기
        </button>
      </form>

      {/* 안내 */}
      {!targetRepo && (
        <p className="text-sm text-gray-400 text-center py-12">
          저장소를 입력하고 분석하기 버튼을 누르세요.
        </p>
      )}

      {/* 에러 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6">
          오류: {error}
        </div>
      )}

      {/* 분석 결과 */}
      {summary && (
        <div>
          {/* 메타 정보 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
              오늘 커밋 {commitCount}건 분석
            </span>
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {/* 마크다운 결과 (pre-formatted) */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="prose prose-sm max-w-none">
              {summary.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-base font-bold text-gray-800 mt-4 mb-2">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-sm font-semibold text-gray-700 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('- ')) {
                  return <p key={i} className="text-sm text-gray-600 ml-3 mb-1">• {line.replace('- ', '')}</p>;
                }
                if (line === '') {
                  return <div key={i} className="h-1" />;
                }
                return <p key={i} className="text-sm text-gray-600 mb-1">{line}</p>;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
