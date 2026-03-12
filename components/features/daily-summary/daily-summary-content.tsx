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

/** 인라인 마크다운 → HTML 변환 (화면 표시용) */
function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 text-primary-300 px-1 py-0.5 rounded">$1</code>');
}

/** 마크다운 한 줄 → JSX */
function MarkdownLine({ line, index }: { line: string; index: number }) {
  if (line.startsWith('## ')) {
    return (
      <h2
        key={index}
        className="text-base font-bold text-neutral-900 dark:text-neutral-50 mt-4 mb-2"
        dangerouslySetInnerHTML={{ __html: renderInline(line.slice(3)) }}
      />
    );
  }
  if (line.startsWith('### ')) {
    return (
      <h3
        key={index}
        className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mt-4 mb-2"
        dangerouslySetInnerHTML={{ __html: renderInline(line.slice(4)) }}
      />
    );
  }
  if (line.startsWith('- ')) {
    return (
      <p
        key={index}
        className="text-sm text-neutral-500 dark:text-neutral-400 ml-3 mb-1"
        dangerouslySetInnerHTML={{ __html: '• ' + renderInline(line.slice(2)) }}
      />
    );
  }
  if (line === '') return <div key={index} className="h-1" />;
  return (
    <p
      key={index}
      className="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
      dangerouslySetInnerHTML={{ __html: renderInline(line) }}
    />
  );
}

export function DailySummaryContent() {
  const [query, setQuery] = useState<{ repo: string; branch?: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [showModels, setShowModels] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const { models, isLoading: modelsLoading, error: modelsError } = useModels(showModels);
  const {
    summary,
    commitCount,
    isLoading: summaryLoading,
    error: summaryError,
  } = useDailySummary({
    repo: query?.repo ?? '',
    branch: query?.branch,
    model: selectedModel,
    enabled: !showModels && query?.repo !== undefined,
    refreshKey,
  });

  const isLoading = showModels ? modelsLoading : summaryLoading;
  const error = showModels ? modelsError : summaryError;

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">오늘의 작업 정리</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowModels(true)}
          className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-primary-300 transition-colors"
        >
          모델 목록 보기
        </button>
      </div>

      {/* 모델 목록 */}
      {showModels && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
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
            <div className="bg-white dark:bg-surface-card border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-200 dark:divide-neutral-800">
              {models.map((m) => (
                <div key={m} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <span className="font-mono text-sm text-neutral-900 dark:text-neutral-50">{m}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => { setSelectedModel(m); setShowModels(false); }}
                      className="text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-primary-300 transition-colors"
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
            <span className="text-xs text-neutral-500 dark:text-neutral-400">사용 모델:</span>
            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
              {selectedModel}
            </span>
          </div>

          {/* 저장소 입력 폼 */}
          <DailySummaryForm onSearch={setQuery} />

          {!query?.repo && (
            <EmptyState message="저장소를 입력하세요" description="저장소를 입력하고 분석하기 버튼을 누르세요." />
          )}

          {isLoading && <LoadingState message="분석 중..." />}

          {!isLoading && error && <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />}

          {!isLoading && summary && (
            <div>
              {/* 메타 정보 + 복사 버튼 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary-50 dark:bg-primary-900 text-primary-300 px-2 py-1 rounded-full font-medium">
                    오늘 커밋 {commitCount}건 분석
                  </span>
                  {query?.branch && (
                    <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-1 rounded-full font-medium">
                      {query.branch} 브랜치
                    </span>
                  )}
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date().toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors active:scale-95"
                >
                  {copied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      복사됨
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M8 4V2.5A.5.5 0 0 0 7.5 2h-5A.5.5 0 0 0 2 2.5v5A.5.5 0 0 0 2.5 8H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      MD 복사
                    </>
                  )}
                </button>
              </div>

              {/* 본문 렌더링 */}
              <div className="bg-white dark:bg-surface-card border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                <div className="prose prose-sm max-w-none">
                  {summary.split('\n').map((line, i) => (
                    <MarkdownLine key={i} line={line} index={i} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
