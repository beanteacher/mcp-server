import { Suspense } from 'react';
import { UserReposContent } from '@/components/features/user-repos/user-repos-content';
import { LoadingState } from '@/components/LoadingState';

export default function UserReposPage() {
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<LoadingState />}>
        <UserReposContent />
      </Suspense>
    </div>
  );
}
