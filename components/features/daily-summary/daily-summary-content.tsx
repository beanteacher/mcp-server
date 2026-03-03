'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { DailySummaryForm } from '@/components/features/daily-summary/daily-summary-form';
import { useDailySummary } from '@/hooks/use-daily-summary';
import { useModels } from '@/hooks/use-models';

const DEFAULT_MODEL = 'models/gemini-2.5-flash';

interface DailySummaryContentProps {
  defaultRepo: string;
}

export function DailySummaryContent({ defaultRepo }: DailySummaryContentProps) {
  const searchParams = useSearchParams();
  const targetRepo = searchParams.get('repo') ?? defaultRepo;
  const showModels = searchParams.get('models') === '1';
  const selectedModel = searchParams.get('model') ?? DEFAULT_MODEL;

  const { models, isLoading: modelsLoading, error: modelsError } = useModels(showModels);
  const {
    summary,
    commitCount,
    isLoading: summaryLoading,
    error: summaryError,
  } = useDailySummary({ repo: targetRepo, model: selectedModel, enabled: !showModels });

  const isLoading = showModels ? modelsLoading : summaryLoading;
  const error = showModels ? modelsError : summaryError;

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h2 className="text-lg font-semibold text-gray-800">오늘의 작업 정리</h2>
        </div>
        <Link
          href={`/daily-summary?models=1${targetRepo ? `&repo=${targetRepo}` : ''}`}
          className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
        >
          모델 목록 보기
        </Link>
      </div>

      {/* 모델 목록 */}
      {showModels && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              generateContent 지원 모델 목록
            </h3>
            <Link
              href={`/daily-summary${targetRepo ? `?repo=${targetRepo}` : ''}`}
              className="text-xs text-blue-500 hover:underline"
            >
              ← 분석으로 돌아가기
            </Link>
          </div>
          {isLoading && (
            <p className="text-sm text-gray-400 text-center py-12">불러오는 중...</p>
          )}
          {!isLoading && error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              오류: {error}
            </div>
          )}
          {!isLoading && !error && (
            <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
              {models.map((m) => (
                <div key={m} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <span className="font-mono text-sm text-gray-700">{m}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/daily-summary?model=${encodeURIComponent(m)}${targetRepo ? `&repo=${targetRepo}` : ''}`}
                      className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
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
            <span className="text-xs text-gray-400">사용 모델:</span>
            <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
              {selectedModel}
            </span>
          </div>

          {/* 저장소 입력 폼 */}
          <DailySummaryForm selectedModel={selectedModel} />

          {!targetRepo && (
            <p className="text-sm text-gray-400 text-center py-12">
              저장소를 입력하고 분석하기 버튼을 누르세요.
            </p>
          )}

          {isLoading && (
            <p className="text-sm text-gray-400 text-center py-12">분석 중...</p>
          )}

          {!isLoading && error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6">
              오류: {error}
            </div>
          )}

          {!isLoading && summary && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                  오늘 커밋 {commitCount}건 분석
                </span>
                <span className="text-xs text-gray-400">
                  {new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="prose prose-sm max-w-none">
                  {summary.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={i} className="text-base font-bold text-gray-800 mt-4 mb-2">
                          {line.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={i} className="text-sm font-semibold text-gray-700 mt-4 mb-2">
                          {line.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <p key={i} className="text-sm text-gray-600 ml-3 mb-1">
                          • {line.replace('- ', '')}
                        </p>
                      );
                    }
                    if (line === '') return <div key={i} className="h-1" />;
                    return (
                      <p key={i} className="text-sm text-gray-600 mb-1">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
