import { Suspense } from 'react';
import { CommitsContent } from '@/components/features/commits/commits-content';

export default function CommitsPage() {
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<p className="text-sm text-gray-400 text-center py-12">로딩 중...</p>}>
        <CommitsContent />
      </Suspense>
    </div>
  );
}
