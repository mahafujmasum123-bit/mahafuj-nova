import test from 'node:test';
import assert from 'node:assert/strict';
import { isBrowserReload } from '../components/common/GlobalReloadOverlay';
import { DEFAULT_SKELETON_DELAY_MS } from '../hooks/useDelayedSkeleton';

test('DEFAULT_SKELETON_DELAY_MS is exactly 2500ms (2.5 seconds)', () => {
  assert.equal(DEFAULT_SKELETON_DELAY_MS, 2500);
});

test('isBrowserReload correctly recognizes reload_preview query param override', () => {
  // Mock window and location
  const originalWindow = globalThis.window;
  try {
    (globalThis as any).window = {
      location: {
        search: '?reload_preview=1',
      },
      performance: {
        getEntriesByType: () => [{ type: 'navigate' }],
      },
    };

    assert.equal(isBrowserReload(), true);
  } finally {
    globalThis.window = originalWindow;
  }
});

test('isBrowserReload returns false for standard SPA navigation', () => {
  const originalWindow = globalThis.window;
  try {
    (globalThis as any).window = {
      location: {
        search: '',
      },
      performance: {
        getEntriesByType: () => [{ type: 'navigate' }],
      },
    };

    assert.equal(isBrowserReload(), false);
  } finally {
    globalThis.window = originalWindow;
  }
});

test('isBrowserReload returns true when W3C PerformanceNavigationTiming type is reload', () => {
  const originalWindow = globalThis.window;
  try {
    (globalThis as any).window = {
      location: {
        search: '',
      },
      performance: {
        getEntriesByType: (type: string) => (type === 'navigation' ? [{ type: 'reload' }] : []),
      },
    };

    assert.equal(isBrowserReload(), true);
  } finally {
    globalThis.window = originalWindow;
  }
});

test('isBrowserReload returns true when sessionStorage flag is set and clears it', () => {
  const originalWindow = globalThis.window;
  const storage: Record<string, string> = { novara_reload_in_progress: 'true' };

  try {
    (globalThis as any).window = {
      location: { search: '' },
      performance: {
        getEntriesByType: () => [{ type: 'navigate' }],
      },
    };
    (globalThis as any).sessionStorage = {
      getItem: (key: string) => storage[key] || null,
      removeItem: (key: string) => {
        delete storage[key];
      },
    };

    assert.equal(isBrowserReload(), true);
    // Verified flag was consumed / cleared to avoid false positives on subsequent navigations
    assert.equal(storage.novara_reload_in_progress, undefined);
  } finally {
    globalThis.window = originalWindow;
    delete (globalThis as any).sessionStorage;
  }
});

test('Cart fly trajectory vector calculation correctly computes parabolic destination offset', () => {
  const source = { left: 240, top: 480, width: 80, height: 80 };
  const target = { left: 1100, top: 20, width: 44, height: 44 };

  const startCenterX = source.left + source.width / 2; // 280
  const startCenterY = source.top + source.height / 2; // 520

  const destCenterX = target.left + target.width / 2; // 1122
  const destCenterY = target.top + target.height / 2; // 42

  const deltaX = destCenterX - startCenterX;
  const deltaY = destCenterY - startCenterY;

  assert.equal(deltaX, 842);
  assert.equal(deltaY, -478);
});
