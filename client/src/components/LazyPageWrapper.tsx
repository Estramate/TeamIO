import React, { Suspense, startTransition, useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';

interface LazyPageWrapperProps {
  children: React.ReactNode;
}

export function LazyPageWrapper({ children }: LazyPageWrapperProps) {
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    // Use startTransition to prevent synchronous suspense warnings
    startTransition(() => {
      setIsPending(false);
    });
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardSkeleton />}>
        {isPending ? <DashboardSkeleton /> : children}
      </Suspense>
    </ErrorBoundary>
  );
}

interface LazyComponentWrapperProps {
  component: React.ComponentType;
}

export function LazyComponentWrapper({ component: Component }: LazyComponentWrapperProps) {
  return (
    <LazyPageWrapper>
      <Component />
    </LazyPageWrapper>
  );
}