import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { removeToast, ToastItem } from '../../features/toast/toastSlice';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ToastCardProps {
  toast: ToastItem;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast }) => {
  const dispatch = useAppDispatch();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(toast.duration || 4000);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    const totalDuration = toast.duration || 4000;
    const intervalMs = 20;

    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        remainingTimeRef.current -= intervalMs;
        const pct = Math.max(0, (remainingTimeRef.current / totalDuration) * 100);
        setProgress(pct);

        if (remainingTimeRef.current <= 0) {
          clearInterval(intervalRef.current);
          dispatch(removeToast(toast.id));
        }
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [toast.id, toast.duration, isPaused, dispatch]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-white border-emerald-500/30 text-emerald-950',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          barBg: 'bg-emerald-500',
        };
      case 'error':
        return {
          bg: 'bg-white border-rose-500/30 text-rose-950',
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          barBg: 'bg-rose-500',
        };
      case 'warning':
        return {
          bg: 'bg-white border-amber-500/30 text-amber-950',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          barBg: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          bg: 'bg-white border-sky-500/30 text-sky-950',
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
          barBg: 'bg-sky-500',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-84 sm:w-96 shadow-xl rounded-xl border p-4 transition-all duration-200 overflow-hidden ${theme.bg}`}
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-start gap-3">
        {theme.icon}
        <div className="flex-1 pr-2">
          {toast.title && <div className="text-sm font-semibold tracking-tight">{toast.title}</div>}
          <div className="text-xs text-gray-700 leading-relaxed mt-0.5">{toast.message}</div>
        </div>
        <button
          onClick={() => dispatch(removeToast(toast.id))}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1 -mr-1 -mt-1 rounded-md"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mandatory right-to-left animated progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${theme.barBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useAppSelector((state) => state.toast.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2.5 max-w-full pointer-events-auto"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
