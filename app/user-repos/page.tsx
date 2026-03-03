import { Suspense } from 'react';
import { UserReposContent } from '@/components/features/user-repos/user-repos-content';

export default function UserReposPage() {
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<p className="text-sm text-gray-400 text-center py-12">로딩 중...</p>}>
        <UserReposContent />
      </Suspense>
    </div>
  );
}
