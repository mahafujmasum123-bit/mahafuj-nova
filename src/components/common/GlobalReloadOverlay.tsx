import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';

const RELOAD_DURATION_MS = 5000;
const FADE_OUT_DURATION_MS = 500;

/**
 * Detects whether the current page load is a genuine browser reload
 * (e.g., F5, Ctrl+R, browser refresh button, or programmatic reload)
 * using the W3C Navigation Timing API.
 * Does NOT trigger on client-side SPA navigation.
 */
export function isBrowserReload(): boolean {
  if (typeof window === 'undefined') return false;

  // Check URL override for testing/demo (e.g. ?reload_preview=1)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reload_preview') === '1') {
      return true;
    }
  } catch {}

  // Check performance navigation entries (Standard W3C Navigation Timing Level 2)
  if (typeof window.performance !== 'undefined') {
    try {
      const navEntries = window.performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        if (nav.type === 'reload') {
          return true;
        }
      }

      // Legacy Navigation Timing Level 1 fallback
      if (window.performance && 'navigation' in window.performance && (window.performance as { navigation?: { type?: number } }).navigation?.type === 1) {
        return true;
      }
    } catch (e) {
      // In case of restricted iframe or sandbox
    }
  }

  // Session storage reload flag check
  try {
    if (sessionStorage.getItem('novara_reload_in_progress') === 'true') {
      sessionStorage.removeItem('novara_reload_in_progress');
      return true;
    }
  } catch {}

  return false;
}

export const GlobalReloadOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);
  const hasInitialized = useRef<boolean>(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Listen for beforeunload to set reload detection flag
    const handleBeforeUnload = () => {
      try {
        sessionStorage.setItem('novara_reload_in_progress', 'true');
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check if current page mount is due to an actual reload
    const isReload = isBrowserReload();

    if (isReload) {
      setIsVisible(true);
      setIsFadingOut(false);
      setSecondsRemaining(5);

      // Countdown interval for real-time progress feedback
      const countdownInterval = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(1, prev - 1));
      }, 1000);

      // Start fade out at (RELOAD_DURATION_MS - FADE_OUT_DURATION_MS)
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, RELOAD_DURATION_MS - FADE_OUT_DURATION_MS);

      // Completely remove overlay after exactly 5 seconds
      const finishTimer = setTimeout(() => {
        setIsVisible(false);
        setIsFadingOut(false);
        clearInterval(countdownInterval);
      }, RELOAD_DURATION_MS);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        clearInterval(countdownInterval);
        clearTimeout(fadeTimer);
        clearTimeout(finishTimer);
      };
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Allow manual event trigger for QA or programmatic inspection
  useEffect(() => {
    const handleTrigger = () => {
      setIsVisible(true);
      setIsFadingOut(false);
      setSecondsRemaining(5);

      const countdown = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(1, prev - 1));
      }, 1000);

      const fade = setTimeout(() => {
        setIsFadingOut(true);
      }, RELOAD_DURATION_MS - FADE_OUT_DURATION_MS);

      const finish = setTimeout(() => {
        setIsVisible(false);
        setIsFadingOut(false);
        clearInterval(countdown);
      }, RELOAD_DURATION_MS);
    };

    window.addEventListener('trigger-reload-animation', handleTrigger);
    return () => window.removeEventListener('trigger-reload-animation', handleTrigger);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Restoring session"
      data-testid="global-reload-overlay"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0c261e] select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle ambient lighting gradients matching ShopMax brand identity */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Center Composition: Real Logo + Rotating Circular Spinner */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center max-w-sm mx-auto">
        {/* Logo and circular spinner container */}
        <div className="relative flex items-center justify-center">
          {/* Circular animated loading spinner ring enclosing the logo */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-3 border-emerald-500/20 border-t-emerald-400 border-r-emerald-400 animate-spin transition-transform" />

          {/* Secondary subtle counter-rotating pulse ring */}
          <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-emerald-400/15 border-b-emerald-300/40 animate-[spin_3s_linear_infinite_reverse]" />

          {/* Centered Website Logo */}
          <div className="absolute inset-0 m-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-2xl shadow-emerald-950/80 ring-2 ring-emerald-400/30">
            <ShoppingBag className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-300" />
          </div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1">
            <span>Shop</span>
            <span className="text-emerald-400">Max</span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-200/70 tracking-widest uppercase">
            Better Products, Better Life
          </div>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="w-48 sm:w-56 space-y-2 pt-2">
          {/* 5-second progress track */}
          <div className="w-full h-1.5 bg-emerald-950/80 rounded-full overflow-hidden border border-emerald-800/40">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 rounded-full transition-all duration-100 ease-linear"
              style={{
                animation: `reload-progress ${RELOAD_DURATION_MS}ms linear forwards`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300/70">
            <span>Restoring session...</span>
            <span className="font-mono">{secondsRemaining}s</span>
          </div>
        </div>
      </div>

      {/* Animation keyframe stylesheet injection */}
      <style>{`
        @keyframes reload-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};
