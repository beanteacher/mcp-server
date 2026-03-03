import { Suspense } from 'react';
import { DailySummaryContent } from '@/components/features/daily-summary/daily-summary-content';

export const dynamic = 'force-dynamic';

export default function DailySummaryPage() {
  const defaultRepo = process.env.GITHUB_DEFAULT_REPO ?? '';
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<p className="text-sm text-gray-400 text-center py-12">로딩 중...</p>}>
        <DailySummaryContent defaultRepo={defaultRepo} />
      </Suspense>
    </div>
  );
}
