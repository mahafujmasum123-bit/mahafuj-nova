import { useEffect } from 'react';

export function useVisitorAnalytics(currentPath: string = '/') {
  useEffect(() => {
    // Generate or retrieve persistent session ID
    let sessionId = sessionStorage.getItem('shopmax_session_id');
    if (!sessionId) {
      sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('shopmax_session_id', sessionId);
    }

    const device = window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';

    // 1. Send pageview event
    fetch('/api/analytics/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentPath, sessionId }),
    }).catch(() => {});

    // 2. Initial heartbeat
    const sendHeartbeat = () => {
      fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          page: currentPath,
          device,
        }),
      }).catch(() => {});
    };

    sendHeartbeat();

    // 3. Keep heartbeat interval every 45s
    const interval = setInterval(sendHeartbeat, 45000);
    return () => clearInterval(interval);
  }, [currentPath]);
}
