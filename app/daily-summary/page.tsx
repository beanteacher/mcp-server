import { Suspense } from 'react';
import { DailySummaryContent } from '@/components/features/daily-summary/daily-summary-content';
import { LoadingState } from '@/components/LoadingState';

export const dynamic = 'force-dynamic';

export default function DailySummaryPage() {
  const defaultRepo = process.env.GITHUB_DEFAULT_REPO ?? '';
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<LoadingState />}>
        <DailySummaryContent defaultRepo={defaultRepo} />
      </Suspense>
    </div>
  );
}
