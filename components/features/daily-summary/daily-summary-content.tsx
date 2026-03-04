'use client';

import { useState } from 'react';
import { BackButton } from '@/components/ui/back-button';
import { DailySummaryForm } from '@/components/features/daily-summary/daily-summary-form';
import { useDailySummary } from '@/hooks/use-daily-summary';
import { useModels } from '@/hooks/use-models';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

const DEFAULT_MODEL = 'models/gemini-2.5-flash';

export function DailySummaryContent() {
  const [repo, setRepo] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [showModels, setShowModels] = useState(false);

  const { models, isLoading: modelsLoading, error: modelsError } = useModels(showModels);
  const {
    summary,
    commitCount,
    isLoading: summaryLoading,
    error: summaryError,
  } = useDailySummary({ repo, model: selectedModel, enabled: !showModels && repo !== '' });

  const isLoading = showModels ? modelsLoading : summaryLoading;
  const error = showModels ? modelsError : summaryError;

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h2 className="text-lg font-semibold text-neutral-50">오늘의 작업 정리</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowModels(true)}
          className="text-xs text-neutral-600 hover:text-primary-300 transition-colors"
        >
          모델 목록 보기
        </button>
      </div>

      {/* 모델 목록 */}
      {showModels && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-50">
              generateContent 지원 모델 목록
            </h3>
            <button
              type="button"
              onClick={() => setShowModels(false)}
              className="text-xs text-primary-300 hover:underline"
            >
              ← 분석으로 돌아가기
            </button>
          </div>
          {isLoading && <LoadingState />}
          {!isLoading && error && <ErrorState message={error} />}
          {!isLoading && !error && (
            <div className="bg-surface-card border border-neutral-800 rounded-xl divide-y divide-neutral-800">
              {models.map((m) => (
                <div key={m} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <span className="font-mono text-sm text-neutral-50">{m}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => { setSelectedModel(m); setShowModels(false); }}
                      className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-primary-300 transition-colors"
                    >
                      이 모델로 분석
                    </button>
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
          <DailySummaryForm onSearch={setRepo} />

          {!repo && (
            <EmptyState message="저장소를 입력하세요" description="저장소를 입력하고 분석하기 버튼을 누르세요." />
          )}

          {isLoading && <LoadingState message="분석 중..." />}

          {!isLoading && error && <ErrorState message={error} />}

          {!isLoading && summary && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-primary-900 text-primary-300 px-2 py-1 rounded-full font-medium">
                  오늘 커밋 {commitCount}건 분석
                </span>
                <span className="text-xs text-neutral-400">
                  {new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="bg-surface-card border border-neutral-800 rounded-xl p-6">
                <div className="prose prose-sm max-w-none">
                  {summary.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={i} className="text-base font-bold text-neutral-50 mt-4 mb-2">
                          {line.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={i} className="text-sm font-semibold text-neutral-200 mt-4 mb-2">
                          {line.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <p key={i} className="text-sm text-neutral-400 ml-3 mb-1">
                          • {line.replace('- ', '')}
                        </p>
                      );
                    }
                    if (line === '') return <div key={i} className="h-1" />;
                    return (
                      <p key={i} className="text-sm text-neutral-400 mb-1">
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
