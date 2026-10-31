import React from 'react';
import { useDelayedSkeleton, DEFAULT_SKELETON_DELAY_MS } from '../../hooks/useDelayedSkeleton';

interface DelayedSkeletonProps {
  isLoading: boolean;
  delayMs?: number;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable DelayedSkeleton Component
 *
 * Automatically manages intelligent delayed rendering:
 * - If `isLoading` resolves in < delayMs (default 2500ms), shows `children` directly with zero skeleton flash.
 * - If `isLoading` exceeds delayMs, smoothly mounts `skeleton`.
 * - When `isLoading` resolves, smoothly crossfades into `children`.
 */
export const DelayedSkeleton: React.FC<DelayedSkeletonProps> = ({
  isLoading,
  delayMs = DEFAULT_SKELETON_DELAY_MS,
  skeleton,
  children,
  className = '',
}) => {
  const showSkeleton = useDelayedSkeleton(isLoading, delayMs);

  if (isLoading && showSkeleton) {
    return <div className={`delayed-skeleton-container ${className}`}>{skeleton}</div>;
  }

  if (isLoading && !showSkeleton) {
    // Hidden during initial 2.5s window so quick API responses render without intrusive flash
    return null;
  }

  return <>{children}</>;
};
