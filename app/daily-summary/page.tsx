import Link from 'next/link';
import { getTodayCommits, getCommitDetail } from '@/lib/github';
import { analyzeDailyWork, listAvailableModels } from '@/lib/gemini';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

const DEFAULT_MODEL = 'models/gemini-2.5-flash';

export default async function DailySummaryPage({
  searchParams,
}: {
  searchParams: { repo?: string; models?: string; model?: string };
}) {
  const targetRepo = searchParams?.repo || process.env.GITHUB_DEFAULT_REPO || '';
  const showModels = searchParams?.models === '1';
  const selectedModel = searchParams?.model || DEFAULT_MODEL;
  const [owner, repoName] = targetRepo.split('/');

  let summary: string | null = null;
  let error: string | null = null;
  let commitCount = 0;
  let availableModels: string[] = [];

  if (showModels) {
    try {
      availableModels = await listAvailableModels();
    } catch (e) {
      error = e instanceof Error ? e.message : '모델 목록 조회 실패';
    }
  } else if (owner && repoName) {
    try {
      const todayCommits = await getTodayCommits(owner, repoName);
      commitCount = todayCommits.length;

      if (todayCommits.length > 0) {
        const details = await Promise.all(
          todayCommits.slice(0, 10).map((c) => getCommitDetail(owner, repoName, c.sha))
        );
        summary = await analyzeDailyWork(targetRepo, details, selectedModel);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-neutral-600 hover:text-neutral-50 transition-colors text-sm font-medium">
            ← 뒤로
          </Link>
          <h2 className="text-lg font-semibold text-neutral-50">오늘의 작업 정리</h2>
        </div>
        <Link
          href={`/daily-summary?models=1${targetRepo ? `&repo=${targetRepo}` : ''}`}
          className="text-xs text-neutral-600 hover:text-primary-300 transition-colors"
        >
          모델 목록 보기
        </Link>
      </div>

      {/* 모델 목록 */}
      {showModels && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-50">
              generateContent 지원 모델 목록
            </h3>
            <Link
              href={`/daily-summary${targetRepo ? `?repo=${targetRepo}` : ''}`}
              className="text-xs text-primary-300 hover:underline"
            >
              ← 분석으로 돌아가기
            </Link>
          </div>
          {error ? (
            <ErrorState message={error} />
          ) : (
            <div className="bg-surface-card border border-neutral-800 rounded-xl divide-y divide-neutral-800">
              {availableModels.map((m) => (
                <div key={m} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <span className="font-mono text-sm text-neutral-50">{m}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/daily-summary?model=${encodeURIComponent(m)}${targetRepo ? `&repo=${targetRepo}` : ''}`}
                      className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-primary-300 transition-colors"
                    >
                      이 모델로 분석
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 분석 영역 */}
      {!showModels && (
        <>
          {/* 현재 사용 모델 표시 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-neutral-400">사용 모델:</span>
            <span className="font-mono text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
              {selectedModel}
            </span>
          </div>

          {/* 저장소 입력 폼 */}
          <form method="GET" className="flex gap-2 mb-8">
            <input type="hidden" name="model" value={selectedModel} />
            <input
              type="text"
              name="repo"
              defaultValue={targetRepo}
              placeholder="owner/repo (예: wisecan-github/web-wisecan-oam-back)"
              className="flex-1 px-3 py-2 text-sm border border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-neutral-800 text-neutral-50 placeholder:text-neutral-600"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-700 rounded-lg transition-colors whitespace-nowrap"
            >
              분석하기
            </button>
          </form>

          {!targetRepo && (
            <EmptyState
              message="저장소를 입력하세요"
              description="owner/repo 형식으로 입력 후 분석하기를 누르세요."
            />
          )}

          {error && <ErrorState message={error} />}

          {summary && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-primary-900 text-primary-300 px-2 py-1 rounded-full font-medium">
                  오늘 커밋 {commitCount}건 분석
                </span>
                <span className="text-xs text-neutral-400">
                  {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              <div className="bg-surface-card border border-neutral-800 rounded-xl p-6">
                <div className="prose prose-sm max-w-none">
                  {summary.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-base font-bold text-neutral-50 mt-4 mb-2">{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={i} className="text-sm font-semibold text-neutral-200 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                    }
                    if (line.startsWith('- ')) {
                      return <p key={i} className="text-sm text-neutral-400 ml-3 mb-1">• {line.replace('- ', '')}</p>;
                    }
                    if (line === '') return <div key={i} className="h-1" />;
                    return <p key={i} className="text-sm text-neutral-400 mb-1">{line}</p>;
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
