import { useState, useEffect, useRef } from 'react';

export const DEFAULT_SKELETON_DELAY_MS = 2500;

/**
 * Intelligent Delayed Skeleton Hook
 *
 * Implements the 2.5-second delayed loading guardrail:
 * 1. When data loading starts, a 2.5-second timer starts.
 * 2. If data completes before 2.5 seconds, the timer is cleared and the skeleton NEVER flashes.
 * 3. If data takes longer than 2.5 seconds, the skeleton gracefully appears.
 * 4. When data completes, the skeleton immediately unmounts to display actual content.
 *
 * @param isLoading Current asynchronous loading state
 * @param delayMs Delay threshold before skeleton appears (default: 2500ms)
 * @returns boolean indicating whether the skeleton should be shown
 */
export function useDelayedSkeleton(isLoading: boolean, delayMs: number = DEFAULT_SKELETON_DELAY_MS): boolean {
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // If not loading, ensure skeleton is hidden and clear any pending timer
    if (!isLoading) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShowSkeleton(false);
      return;
    }

    // When loading starts, wait for the specified delay before showing skeleton
    timerRef.current = setTimeout(() => {
      setShowSkeleton(true);
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading, delayMs]);

  return showSkeleton;
}
