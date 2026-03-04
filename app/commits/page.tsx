import { Suspense } from 'react';
import { CommitsContent } from '@/components/features/commits/commits-content';
import { LoadingState } from '@/components/LoadingState';

export default function CommitsPage() {
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<LoadingState />}>
        <CommitsContent />
      </Suspense>
    </div>
  );
}
